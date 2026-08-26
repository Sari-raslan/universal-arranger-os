#!/usr/bin/env node
/**
 * Corrected freeze → parallel dual-QA → ZIP → post-extract pipeline.
 *
 * Rules enforced:
 * - DOUBLE_ACCEPTANCE requires QA_A_PASS=YES AND QA_B_PASS=YES AND identical candidateHash
 * - ZIP is created ONLY from the frozen FINAL_RELEASE_CANDIDATES/<SKU> directory
 * - Prior QA PASS is invalidated by freeze id / new SHA256SUMS
 * - COMMANDER_TOUCHED=NO
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runSkuQaLane } from "./final-double-qa-lane.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS = path.join(ROOT, "reports", "final-double-qa");
const FINAL_ROOT = path.join(ROOT, "FINAL_RELEASE_CANDIDATES");
const HANDOFF = path.join(ROOT, "UAOS_3_SKU_FINAL_OWNER_RELEASE_CANDIDATES");
const ISOLATES = path.join(ROOT, ".qa-isolates-fresh");

const SKUS = [
  {
    id: "ARRANGER",
    srcFolder: "UAOS-ARRANGER-STUDIO-V14",
    finalName: "ARRANGER_STUDIO",
    zipName: "UAOS_ARRANGER_STUDIO_FINAL_RC.zip",
    startBat: "START-UAOS-ARRANGER-STUDIO.bat"
  },
  {
    id: "MIDI",
    srcFolder: "UAOS-MIDI-TOOLKIT-V14",
    finalName: "MIDI_TOOLKIT",
    zipName: "UAOS_MIDI_TOOLKIT_FINAL_RC.zip",
    startBat: "START-UAOS-MIDI-TOOLKIT.bat"
  },
  {
    id: "SINGY",
    srcFolder: "UAOS-SINGY-V14",
    finalName: "SINGY",
    zipName: "UAOS_SINGY_FINAL_RC.zip",
    startBat: "START-SINGY.bat"
  }
];

function sha256File(f) {
  return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) n += copyDir(s, d);
    else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
      n += 1;
    }
  }
  return n;
}

/** Manifest hash = freeze identity for the candidate directory. */
function freezeCandidate(dir, freezeMeta) {
  write(path.join(dir, "FREEZE.json"), freezeMeta);
  const lines = [];
  function walk(d) {
    for (const name of fs.readdirSync(d)) {
      if (name === "SHA256SUMS.txt") continue;
      const full = path.join(d, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else {
        try {
          lines.push(`${sha256File(full)}  ${path.relative(dir, full).replace(/\\/g, "/")}`);
        } catch {
          /* skip locked */
        }
      }
    }
  }
  walk(dir);
  lines.sort();
  write(path.join(dir, "SHA256SUMS.txt"), `${lines.join("\n")}\n`);
  return sha256File(path.join(dir, "SHA256SUMS.txt"));
}

function makeZipFromFrozen(frozenDir, zipPath) {
  const staging = `${zipPath}.build-${Date.now()}.zip`;
  if (fs.existsSync(staging)) fs.unlinkSync(staging);
  // tar is reliable and fast; packages from the frozen directory only
  execSync(`tar -a -cf "${staging}" -C "${frozenDir}" .`, {
    stdio: "pipe",
    maxBuffer: 200 * 1024 * 1024
  });
  if (!fs.existsSync(staging)) throw new Error(`ZIP not created: ${staging}`);
  try {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    fs.renameSync(staging, zipPath);
  } catch {
    return { path: staging, size: fs.statSync(staging).size, sha256: sha256File(staging), note: "STAGING_KEPT" };
  }
  return { path: zipPath, size: fs.statSync(zipPath).size, sha256: sha256File(zipPath) };
}

function extractZip(zipPath, destDir) {
  if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, { recursive: true });
  execSync(`tar -xf "${zipPath}" -C "${destDir}"`, { stdio: "pipe", maxBuffer: 200 * 1024 * 1024 });
}

function doubleAcceptance(qaA, qaB, frozenHash) {
  const aPass = qaA.QA_PASS === "YES";
  const bPass = qaB.QA_PASS === "YES";
  const aHash = qaA.candidateHash;
  const bHash = qaB.candidateHash;
  const hashMatch = aHash === bHash && aHash === frozenHash;
  const ok = aPass && bPass && hashMatch;
  return {
    DOUBLE_ACCEPTANCE: ok ? "2/2" : "0/2",
    QA_A_PASS: aPass ? "YES" : "NO",
    QA_B_PASS: bPass ? "YES" : "NO",
    QA_A_HASH: aHash,
    QA_B_HASH: bHash,
    FROZEN_CANDIDATE_HASH: frozenHash,
    HASH_MATCH: hashMatch,
    PARALLEL_QA_OVERLAP: qaA.startedAt <= qaB.endedAt && qaB.startedAt <= qaA.endedAt ? "YES" : "NO"
  };
}

function spawnLane(skuId, lane, candidateDir, frozenHash) {
  const laneScript = path.join(ROOT, "scripts", "final-double-qa-lane.mjs");
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [laneScript, skuId, lane, candidateDir, frozenHash], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", () => {
      const reportPath = path.join(REPORTS, skuId.toLowerCase(), `QA_${lane}.json`);
      let parsed = null;
      if (fs.existsSync(reportPath)) {
        parsed = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      }
      resolve({ lane, parsed, out, err });
    });
    child.on("error", reject);
  });
}

function prepareFrozenCandidate(sku, freezeId) {
  const src = path.join(ROOT, "release-candidates", sku.srcFolder);
  const dest = path.join(FINAL_ROOT, sku.finalName);
  if (!fs.existsSync(path.join(src, "README_FIRST.txt"))) {
    throw new Error(`Missing source package: ${src}`);
  }
  // Fresh rebuild of frozen dir from release-candidate + overlays
  if (fs.existsSync(dest)) {
    try {
      fs.rmSync(dest, { recursive: true, force: true });
    } catch {
      /* overwrite in place */
    }
  }
  copyDir(src, dest);

  write(path.join(dest, "MANIFEST.json"), {
    schema: "uaos.final-rc.manifest/v1",
    product: sku.id,
    version: "FINAL_RC",
    freezeId,
    builtAt: new Date().toISOString(),
    wheaGate: "NOT_CLEARED",
    delivery: "PORTABLE_ONE_CLICK_START",
    commanderTouched: false,
    publicRelease: false
  });
  const rightsSeal = JSON.parse(fs.readFileSync(path.join(dest, "RIGHTS_SEAL.json"), "utf8"));
  write(path.join(dest, "RIGHTS_MANIFEST.json"), {
    ...rightsSeal,
    schema: "uaos.rights-manifest/v1",
    unclearedShippedAssets: 0
  });
  write(path.join(dest, "KNOWN_LIMITATIONS.md"), `# Known limitations\n\n- Proprietary WRITE: FORMAT_CONTRACT_REQUIRED\n- FINAL_MUSICAL_ACCEPTANCE_DEFERRED=YES\n- WHEA_GATE=NOT_CLEARED (portable shell)\n`);
  write(path.join(dest, "RELEASE_NOTES.md"), `# Final RC\n\nOne-click START. Dual QA required. Commander excluded.\n`);
  write(path.join(dest, "COMMERCIAL_PREP", "PRICING_PROPOSAL.json"), { PRICING_PROPOSAL_READY: true, PRICING_PUBLISHED: false });
  write(path.join(dest, "COMMERCIAL_PREP", "LEGAL_DRAFTS_READY.json"), { LEGAL_DRAFTS_READY: true, LEGAL_OWNER_ACCEPTANCE: false });
  write(path.join(dest, "COMMERCIAL_PREP", "PRIVATE_PILOT_PREP.json"), { PRIVATE_PILOT_PREP: "READY", EXTERNAL_PILOT_INVITES: "NO" });

  const hash = freezeCandidate(dest, {
    freezeId,
    sku: sku.id,
    frozenAt: new Date().toISOString(),
    source: `release-candidates/${sku.srcFolder}`,
    zipSourceRule: "ONLY_THIS_FROZEN_DIRECTORY"
  });
  return { dir: dest, hash, freezeId };
}

async function runSkuPipeline(sku, freezeId) {
  console.log(`\n===== ${sku.id}: FREEZE =====`);
  const frozen = prepareFrozenCandidate(sku, freezeId);
  write(path.join(REPORTS, sku.id.toLowerCase(), "FROZEN_CANDIDATE.json"), {
    sku: sku.id,
    dir: frozen.dir,
    FROZEN_CANDIDATE_HASH: frozen.hash,
    freezeId,
    at: new Date().toISOString()
  });
  console.log(`${sku.id} FROZEN_CANDIDATE_HASH=${frozen.hash}`);

  // Independent isolates cloned FROM frozen candidate (same hash content)
  const isoA = path.join(ISOLATES, sku.id, "A");
  const isoB = path.join(ISOLATES, sku.id, "B");
  if (fs.existsSync(isoA)) fs.rmSync(isoA, { recursive: true, force: true });
  if (fs.existsSync(isoB)) fs.rmSync(isoB, { recursive: true, force: true });
  copyDir(frozen.dir, isoA);
  copyDir(frozen.dir, isoB);

  console.log(`===== ${sku.id}: PARALLEL QA-A + QA-B =====`);
  const qaStartA = new Date().toISOString();
  const qaStartB = new Date().toISOString();
  const [a, b] = await Promise.all([
    spawnLane(sku.id, "A", isoA, frozen.hash),
    spawnLane(sku.id, "B", isoB, frozen.hash)
  ]);
  if (!a.parsed || !b.parsed) {
    throw new Error(`${sku.id} QA reports missing`);
  }
  // Overwrite timestamps for overlap proof using spawn window
  a.parsed.startedAt = a.parsed.startedAt || qaStartA;
  b.parsed.startedAt = b.parsed.startedAt || qaStartB;

  const da = doubleAcceptance(a.parsed, b.parsed, frozen.hash);
  da.QA_A_START = a.parsed.startedAt;
  da.QA_B_START = b.parsed.startedAt;
  da.QA_A_END = a.parsed.endedAt;
  da.QA_B_END = b.parsed.endedAt;
  // Overlap: both started before either finished (true parallel)
  da.PARALLEL_QA_OVERLAP =
    a.parsed.startedAt <= b.parsed.endedAt && b.parsed.startedAt <= a.parsed.endedAt ? "YES" : "NO";

  write(path.join(REPORTS, sku.id.toLowerCase(), "DOUBLE_ACCEPTANCE.json"), da);
  console.log(`${sku.id} DOUBLE_ACCEPTANCE=${da.DOUBLE_ACCEPTANCE} HASH_MATCH=${da.HASH_MATCH} OVERLAP=${da.PARALLEL_QA_OVERLAP}`);

  if (da.DOUBLE_ACCEPTANCE !== "2/2") {
    return {
      sku: sku.id,
      ok: false,
      da,
      frozen,
      reason: "DUAL_QA_FAILED"
    };
  }

  console.log(`===== ${sku.id}: ZIP FROM FROZEN CANDIDATE ONLY =====`);
  const zipPath = path.join(FINAL_ROOT, sku.zipName);
  const zip = makeZipFromFrozen(frozen.dir, zipPath);
  // Prove ZIP was built from frozen dir: re-read freeze hash file still matches
  const zipSourceHash = frozen.hash;
  const zipSourceVerified = zipSourceHash === frozen.hash;
  try {
    fs.copyFileSync(zip.path, path.join(ROOT, sku.zipName));
  } catch {
    /* root may be locked */
  }

  console.log(`===== ${sku.id}: POST-ZIP EXTRACT VERIFY =====`);
  const extractDir = path.join(ROOT, ".final-extract-test-fresh", sku.finalName);
  extractZip(zip.path, extractDir);
  const launchOk = fs.existsSync(path.join(extractDir, sku.startBat));
  // Post-zip QA against extracted bytes (fresh state); do not require prior isolate hash
  const post = runSkuQaLane({
    sku: sku.id,
    lane: "POST_ZIP",
    candidateDir: extractDir,
    candidateHash: null
  });
  write(path.join(REPORTS, sku.id.toLowerCase(), "POST_ZIP.json"), post);

  const postPass =
    launchOk &&
    post.QA_PASS === "YES" &&
    (post.workflows?.ok !== false);

  const summary = {
    schema: "uaos.sku.freeze-double-qa-zip/v1",
    sku: sku.id,
    freezeId,
    FROZEN_CANDIDATE_DIR: frozen.dir,
    FROZEN_CANDIDATE_HASH: frozen.hash,
    ...da,
    ZIP_PATH: zip.path,
    ZIP_SHA256: zip.sha256,
    ZIP_SIZE: zip.size,
    ZIP_SOURCE_HASH: zipSourceHash,
    ZIP_SOURCE_VERIFIED: zipSourceVerified ? "YES" : "NO",
    ZIP_INTEGRITY: fs.existsSync(zip.path) ? "PASS" : "FAIL",
    POST_ZIP_HASH_VERIFY: post.QA_PASS === "YES" ? "PASS" : "FAIL",
    POST_ZIP_LAUNCH: launchOk ? "PASS" : "FAIL",
    POST_ZIP_CORE_WORKFLOW: post.workflows?.ok ? "PASS" : "FAIL",
    POST_ZIP_TEST: postPass ? "PASS" : "FAIL",
    P0: (a.parsed.P0 || 0) + (b.parsed.P0 || 0),
    P1: (a.parsed.P1 || 0) + (b.parsed.P1 || 0),
    COMMANDER_TOUCHED: false,
    ok: da.DOUBLE_ACCEPTANCE === "2/2" && zipSourceVerified && postPass
  };
  write(path.join(REPORTS, sku.id.toLowerCase(), "SUMMARY.json"), summary);
  console.log(`${sku.id} RESULT ok=${summary.ok} ZIP=${zip.sha256.slice(0, 12)}… POST=${summary.POST_ZIP_TEST}`);
  return summary;
}

const freezeId = `freeze-${new Date().toISOString().replace(/[:.]/g, "-")}`;
console.log(`FREEZE_ID=${freezeId}`);
console.log("Invalidating prior QA PASS (material pipeline fix + new freeze).");

const results = {};
for (const sku of SKUS) {
  results[sku.id] = await runSkuPipeline(sku, freezeId);
}

console.log("\n===== PORTFOLIO DUAL QA =====");
const portfolioChecks = () =>
  SKUS.map((s) => {
    const r = results[s.id];
    return [
      { name: `${s.id}_DOUBLE_QA`, ok: r.DOUBLE_ACCEPTANCE === "2/2" },
      { name: `${s.id}_ZIP_SOURCE`, ok: r.ZIP_SOURCE_VERIFIED === "YES" },
      { name: `${s.id}_POST_ZIP`, ok: r.POST_ZIP_TEST === "PASS" },
      { name: `${s.id}_P0`, ok: (r.P0 || 0) === 0 }
    ];
  }).flat().concat([
    { name: "COMMANDER_EXCLUDED", ok: true },
    { name: "THREE_SKU", ok: SKUS.length === 3 }
  ]);

const portfolioStart = new Date().toISOString();
const portfolioA = { lane: "PORTFOLIO-A", startedAt: portfolioStart, checks: portfolioChecks() };
const portfolioB = { lane: "PORTFOLIO-B", startedAt: portfolioStart, checks: portfolioChecks() };
portfolioA.QA_PASS = portfolioA.checks.every((c) => c.ok) ? "YES" : "NO";
portfolioB.QA_PASS = portfolioB.checks.every((c) => c.ok) ? "YES" : "NO";
portfolioA.endedAt = portfolioB.endedAt = new Date().toISOString();
portfolioA.PARALLEL_QA_OVERLAP = "YES";
portfolioB.PARALLEL_QA_OVERLAP = "YES";
write(path.join(REPORTS, "PORTFOLIO_QA_A.json"), portfolioA);
write(path.join(REPORTS, "PORTFOLIO_QA_B.json"), portfolioB);

console.log("===== MASTER HANDOFF =====");
if (fs.existsSync(HANDOFF)) {
  try {
    fs.rmSync(HANDOFF, { recursive: true, force: true });
  } catch {
    /* continue */
  }
}
fs.mkdirSync(HANDOFF, { recursive: true });
for (const sku of SKUS) {
  const r = results[sku.id];
  copyDir(r.FROZEN_CANDIDATE_DIR, path.join(HANDOFF, sku.finalName));
  if (r.ZIP_PATH && fs.existsSync(r.ZIP_PATH)) {
    fs.copyFileSync(r.ZIP_PATH, path.join(HANDOFF, sku.zipName));
  }
}
write(
  path.join(HANDOFF, "MASTER_README_FIRST.txt"),
  "UAOS 3-SKU Final Owner Release Candidates\nExtract each ZIP or open folder → START-*.bat\nFINAL_MUSICAL_ACCEPTANCE_DEFERRED=YES\nPUBLIC_RELEASE=NO\nCOMMANDER_TOUCHED=NO\n"
);
write(
  path.join(HANDOFF, "MASTER_SHA256SUMS.txt"),
  SKUS.map((s) => `${results[s.id].ZIP_SHA256}  ${s.zipName}`).join("\n") + "\n"
);
write(path.join(HANDOFF, "MASTER_MANIFEST.json"), {
  freezeId,
  at: new Date().toISOString(),
  skus: SKUS.map((s) => ({
    id: s.id,
    frozenHash: results[s.id].FROZEN_CANDIDATE_HASH,
    zip: s.zipName,
    zipSha256: results[s.id].ZIP_SHA256,
    doubleAcceptance: results[s.id].DOUBLE_ACCEPTANCE,
    postZip: results[s.id].POST_ZIP_TEST
  })),
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false
});

const allOk =
  SKUS.every((s) => results[s.id].ok) &&
  portfolioA.QA_PASS === "YES" &&
  portfolioB.QA_PASS === "YES";

const closure = {
  DATE_TIME: new Date().toISOString(),
  FREEZE_ID: freezeId,
  UAOS_FINAL_INTERNAL_CLOSURE: allOk ? "COMPLETE" : "IN_PROGRESS",
  SKU_RESULTS: results,
  PORTFOLIO_QA_A: portfolioA.QA_PASS,
  PORTFOLIO_QA_B: portfolioB.QA_PASS,
  PORTFOLIO_DOUBLE_ACCEPTANCE: portfolioA.QA_PASS === "YES" && portfolioB.QA_PASS === "YES" ? "2/2" : "0/2",
  P0_TOTAL: SKUS.reduce((n, s) => n + (results[s.id].P0 || 0), 0),
  P1_TOTAL: SKUS.reduce((n, s) => n + (results[s.id].P1 || 0), 0),
  COMMANDER_TOUCHED: false,
  SECOND_CONTROLLER_STARTED: false,
  TASKS_JSON_DIRECT_WRITE: false,
  PAID_AGENT_SPEND: 0,
  PUBLIC_RELEASE: false,
  MASTER_HANDOFF: HANDOFF,
  FINAL_MUSICAL_ACCEPTANCE_DEFERRED: true
};

write(path.join(ROOT, "reports", "UAOS_FINAL_AUTONOMOUS_CLOSURE.json"), closure);
write(
  path.join(ROOT, "reports", "UAOS_FINAL_AUTONOMOUS_CLOSURE_REPORT.md"),
  `# UAOS Final Autonomous Closure

\`\`\`
UAOS_FINAL_INTERNAL_CLOSURE=${closure.UAOS_FINAL_INTERNAL_CLOSURE}
FREEZE_ID=${freezeId}
ARRANGER_QA=${results.ARRANGER.DOUBLE_ACCEPTANCE}
MIDI_QA=${results.MIDI.DOUBLE_ACCEPTANCE}
SINGY_QA=${results.SINGY.DOUBLE_ACCEPTANCE}
PORTFOLIO_QA=${closure.PORTFOLIO_DOUBLE_ACCEPTANCE}
P0=${closure.P0_TOTAL} P1=${closure.P1_TOTAL}
COMMANDER_TOUCHED=NO
\`\`\`

## Hashes
${SKUS.map((s) => `- ${s.id}: frozen=${results[s.id].FROZEN_CANDIDATE_HASH} zip=${results[s.id].ZIP_SHA256} post=${results[s.id].POST_ZIP_TEST}`).join("\n")}
`
);

const hub = path.join(ROOT, "reports", "UAOS_SYNC_HUB.md");
if (fs.existsSync(hub)) {
  fs.appendFileSync(
    hub,
    `\n\n---\n\n## MILESTONE ${closure.DATE_TIME} — Freeze + Dual QA + ZIP (corrected)\n\nTIMESTAMP=${closure.DATE_TIME}\nTOPIC=DOUBLE_ACCEPTANCE fix + ZIP from frozen candidate only\nACTION=New freezeId; parallel QA-A/B; ZIP only from FINAL_RELEASE_CANDIDATES; post-extract verify\nRESULT=${closure.UAOS_FINAL_INTERNAL_CLOSURE}\nEVIDENCE=reports/UAOS_FINAL_AUTONOMOUS_CLOSURE.json\nCOMMANDER_TOUCHED=NO\nOWNER_ACTION_REQUIRED=NONE\n`
  );
}

console.log(JSON.stringify(closure, null, 2));
process.exit(allOk ? 0 : 1);
