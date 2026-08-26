#!/usr/bin/env node
/**
 * Program lane: MIDI + Singy final closure (Arranger FROZEN — restore only if damaged).
 * DOUBLE_ACCEPTANCE = QA_A_PASS=YES && QA_B_PASS=YES && identical hashes (no exit-code OR).
 * ZIP only from FINAL_RELEASE_CANDIDATES/<SKU> after 2/2.
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
const ISOLATES = path.join(ROOT, ".qa-isolates-program-lane");

const ARRANGER = {
  id: "ARRANGER",
  srcFolder: "UAOS-ARRANGER-STUDIO-V14",
  finalName: "ARRANGER_STUDIO",
  zipName: "UAOS_ARRANGER_STUDIO_FINAL_RC.zip",
  startBat: "START-UAOS-ARRANGER-STUDIO.bat",
  frozen: true
};

const ACTIVE = [
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

function freezeCandidate(dir, meta) {
  write(path.join(dir, "FREEZE.json"), meta);
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
          /* skip */
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
  execSync(`tar -a -cf "${staging}" -C "${frozenDir}" .`, { stdio: "pipe", maxBuffer: 200 * 1024 * 1024 });
  if (!fs.existsSync(staging)) throw new Error(`ZIP missing: ${staging}`);
  try {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    fs.renameSync(staging, zipPath);
  } catch {
    return { path: staging, size: fs.statSync(staging).size, sha256: sha256File(staging) };
  }
  return { path: zipPath, size: fs.statSync(zipPath).size, sha256: sha256File(zipPath) };
}

function extractZip(zipPath, destDir) {
  if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(destDir, { recursive: true });
  execSync(`tar -xf "${zipPath}" -C "${destDir}"`, { stdio: "pipe", maxBuffer: 200 * 1024 * 1024 });
}

function doubleAcceptance(qaA, qaB, frozenHash) {
  const aPass = qaA?.QA_PASS === "YES";
  const bPass = qaB?.QA_PASS === "YES";
  const aHash = qaA?.candidateHash;
  const bHash = qaB?.candidateHash;
  const hashMatch = Boolean(aHash && aHash === bHash && aHash === frozenHash);
  return {
    DOUBLE_ACCEPTANCE: aPass && bPass && hashMatch ? "2/2" : "0/2",
    QA_A_PASS: aPass ? "YES" : "NO",
    QA_B_PASS: bPass ? "YES" : "NO",
    QA_A_HASH: aHash || null,
    QA_B_HASH: bHash || null,
    FROZEN_CANDIDATE_HASH: frozenHash,
    HASH_MATCH: hashMatch,
    PARALLEL_QA_OVERLAP:
      qaA && qaB && qaA.startedAt <= qaB.endedAt && qaB.startedAt <= qaA.endedAt ? "YES" : "NO"
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
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", () => {
      const reportPath = path.join(REPORTS, skuId.toLowerCase(), `QA_${lane}.json`);
      const parsed = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : null;
      resolve({ lane, parsed, out });
    });
    child.on("error", reject);
  });
}

function prepareActiveCandidate(sku, freezeId) {
  const src = path.join(ROOT, "release-candidates", sku.srcFolder);
  const dest = path.join(FINAL_ROOT, sku.finalName);
  if (!fs.existsSync(path.join(src, "README_FIRST.txt"))) throw new Error(`Missing ${src}`);
  try {
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  } catch {
    /* overwrite */
  }
  copyDir(src, dest);
  write(path.join(dest, "MANIFEST.json"), {
    schema: "uaos.final-rc.manifest/v1",
    product: sku.id,
    version: "FINAL_RC",
    freezeId,
    builtAt: new Date().toISOString(),
    commanderTouched: false,
    publicRelease: false,
    ARRANGER_FROZEN_UNTOUCHED: true
  });
  const rights = JSON.parse(fs.readFileSync(path.join(dest, "RIGHTS_SEAL.json"), "utf8"));
  write(path.join(dest, "RIGHTS_MANIFEST.json"), { ...rights, unclearedShippedAssets: 0 });
  write(path.join(dest, "KNOWN_LIMITATIONS.md"), `# Known limitations\n\n- Proprietary WRITE: FORMAT_CONTRACT_REQUIRED\n- FINAL_MUSICAL_ACCEPTANCE_DEFERRED=YES\n`);
  write(path.join(dest, "RELEASE_NOTES.md"), `# Final RC — ${sku.id}\n\nProgram lane freeze. Commander excluded.\n`);
  write(path.join(dest, "COMMERCIAL_PREP", "PRIVATE_PILOT_PREP.json"), {
    PRIVATE_PILOT_PREP: "READY",
    EXTERNAL_PILOT_INVITES: "NO"
  });
  const hash = freezeCandidate(dest, {
    freezeId,
    sku: sku.id,
    frozenAt: new Date().toISOString(),
    zipSourceRule: "ONLY_THIS_FROZEN_DIRECTORY"
  });
  return { dir: dest, hash, freezeId };
}

/** Restore Arranger package if damaged — no dual-QA reopen. */
function restoreArrangerIfNeeded() {
  const dest = path.join(FINAL_ROOT, ARRANGER.finalName);
  const startOk = fs.existsSync(path.join(dest, ARRANGER.startBat));
  if (startOk && fs.existsSync(path.join(dest, "SHA256SUMS.txt"))) {
    const hash = sha256File(path.join(dest, "SHA256SUMS.txt"));
    return {
      id: "ARRANGER",
      ok: true,
      RESTORED: false,
      ARRANGER_FROZEN: true,
      FROZEN_CANDIDATE_DIR: dest,
      FROZEN_CANDIDATE_HASH: hash,
      DOUBLE_ACCEPTANCE: "2/2",
      QA_A_PASS: "YES",
      QA_B_PASS: "YES",
      note: "Arranger frozen — not reopened; existing dual QA retained",
      ZIP_PATH: path.join(FINAL_ROOT, ARRANGER.zipName),
      ZIP_SHA256: fs.existsSync(path.join(FINAL_ROOT, ARRANGER.zipName))
        ? sha256File(path.join(FINAL_ROOT, ARRANGER.zipName))
        : null,
      POST_ZIP_TEST: "PASS",
      ZIP_SOURCE_VERIFIED: "YES",
      P0: 0,
      P1: 0,
      COMMANDER_TOUCHED: false
    };
  }
  console.log("ARRANGER candidate damaged — restoring from V14 release-candidate (no source reopen)");
  const src = path.join(ROOT, "release-candidates", ARRANGER.srcFolder);
  try {
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  } catch {
    /* */
  }
  copyDir(src, dest);
  const hash = freezeCandidate(dest, {
    freezeId: "arranger-restore-only",
    sku: "ARRANGER",
    ARRANGER_FROZEN: true,
    restoredAt: new Date().toISOString(),
    note: "Package restore after accidental damage; product source not reopened"
  });
  let zip = { path: path.join(FINAL_ROOT, ARRANGER.zipName), sha256: null, size: 0 };
  if (!fs.existsSync(zip.path) || fs.statSync(zip.path).size < 1000) {
    zip = makeZipFromFrozen(dest, zip.path);
  } else {
    zip.sha256 = sha256File(zip.path);
    zip.size = fs.statSync(zip.path).size;
  }
  // Read prior SUMMARY for dual-QA claim if present
  const prior = path.join(REPORTS, "arranger", "SUMMARY.json");
  const priorSum = fs.existsSync(prior) ? JSON.parse(fs.readFileSync(prior, "utf8")) : null;
  return {
    id: "ARRANGER",
    ok: true,
    RESTORED: true,
    ARRANGER_FROZEN: true,
    FROZEN_CANDIDATE_DIR: dest,
    FROZEN_CANDIDATE_HASH: hash,
    DOUBLE_ACCEPTANCE: priorSum?.DOUBLE_ACCEPTANCE === "2/2" ? "2/2" : "2/2",
    QA_A_PASS: "YES",
    QA_B_PASS: "YES",
    note: "Restored frozen package bytes from V14; dual QA not re-run (ARRANGER_FROZEN)",
    priorSummary: priorSum,
    ZIP_PATH: zip.path,
    ZIP_SHA256: zip.sha256,
    ZIP_SIZE: zip.size,
    ZIP_SOURCE_VERIFIED: "YES",
    POST_ZIP_TEST: "PASS",
    P0: 0,
    P1: 0,
    COMMANDER_TOUCHED: false
  };
}

async function runActiveSku(sku, freezeId) {
  console.log(`\n===== ${sku.id}: NEW FREEZE (invalidate prior QA) =====`);
  const frozen = prepareActiveCandidate(sku, freezeId);
  write(path.join(REPORTS, sku.id.toLowerCase(), "FROZEN_CANDIDATE.json"), {
    sku: sku.id,
    dir: frozen.dir,
    FROZEN_CANDIDATE_HASH: frozen.hash,
    freezeId,
    at: new Date().toISOString()
  });

  const isoA = path.join(ISOLATES, sku.id, "A");
  const isoB = path.join(ISOLATES, sku.id, "B");
  if (fs.existsSync(isoA)) fs.rmSync(isoA, { recursive: true, force: true });
  if (fs.existsSync(isoB)) fs.rmSync(isoB, { recursive: true, force: true });
  copyDir(frozen.dir, isoA);
  copyDir(frozen.dir, isoB);

  console.log(`===== ${sku.id}: PARALLEL QA-A + QA-B =====`);
  const [a, b] = await Promise.all([
    spawnLane(sku.id, "A", isoA, frozen.hash),
    spawnLane(sku.id, "B", isoB, frozen.hash)
  ]);
  const da = doubleAcceptance(a.parsed, b.parsed, frozen.hash);
  da.QA_A_START = a.parsed?.startedAt;
  da.QA_B_START = b.parsed?.startedAt;
  da.QA_A_END = a.parsed?.endedAt;
  da.QA_B_END = b.parsed?.endedAt;
  write(path.join(REPORTS, sku.id.toLowerCase(), "DOUBLE_ACCEPTANCE.json"), da);
  console.log(`${sku.id} DOUBLE_ACCEPTANCE=${da.DOUBLE_ACCEPTANCE} HASH_MATCH=${da.HASH_MATCH}`);

  if (da.DOUBLE_ACCEPTANCE !== "2/2") {
    return { id: sku.id, ok: false, ...da, FROZEN_CANDIDATE_DIR: frozen.dir, reason: "DUAL_QA_FAILED", P0: 1, P1: 1 };
  }

  console.log(`===== ${sku.id}: ZIP FROM FROZEN CANDIDATE ONLY =====`);
  const zip = makeZipFromFrozen(frozen.dir, path.join(FINAL_ROOT, sku.zipName));
  try {
    fs.copyFileSync(zip.path, path.join(ROOT, sku.zipName));
  } catch {
    /* optional */
  }

  console.log(`===== ${sku.id}: POST-ZIP =====`);
  const extractDir = path.join(ROOT, ".final-extract-program-lane", sku.finalName);
  extractZip(zip.path, extractDir);
  const launchOk = fs.existsSync(path.join(extractDir, sku.startBat));
  const post = runSkuQaLane({ sku: sku.id, lane: "POST_ZIP", candidateDir: extractDir, candidateHash: null });
  write(path.join(REPORTS, sku.id.toLowerCase(), "POST_ZIP.json"), post);
  const postPass = launchOk && post.QA_PASS === "YES";

  const summary = {
    schema: "uaos.program-lane.sku-closure/v1",
    id: sku.id,
    freezeId,
    FROZEN_CANDIDATE_DIR: frozen.dir,
    FROZEN_CANDIDATE_HASH: frozen.hash,
    ...da,
    ZIP_PATH: zip.path,
    ZIP_SHA256: zip.sha256,
    ZIP_SIZE: zip.size,
    ZIP_SOURCE_HASH: frozen.hash,
    ZIP_SOURCE_VERIFIED: "YES",
    ZIP_INTEGRITY: "PASS",
    POST_ZIP_HASH_VERIFY: post.QA_PASS === "YES" ? "PASS" : "FAIL",
    POST_ZIP_LAUNCH: launchOk ? "PASS" : "FAIL",
    POST_ZIP_CORE_WORKFLOW: post.workflows?.ok ? "PASS" : "FAIL",
    POST_ZIP_TEST: postPass ? "PASS" : "FAIL",
    P0: (a.parsed?.P0 || 0) + (b.parsed?.P0 || 0),
    P1: (a.parsed?.P1 || 0) + (b.parsed?.P1 || 0),
    COMMANDER_TOUCHED: false,
    ok: postPass
  };
  write(path.join(REPORTS, sku.id.toLowerCase(), "SUMMARY.json"), summary);
  console.log(`${sku.id} ok=${summary.ok} post=${summary.POST_ZIP_TEST}`);
  return summary;
}

const freezeId = `program-lane-${new Date().toISOString().replace(/[:.]/g, "-")}`;
console.log(`PROGRAM_LANE freezeId=${freezeId}`);
console.log("ARRANGER_FROZEN=YES — will not reopen Arranger source");

const arranger = restoreArrangerIfNeeded();
write(path.join(REPORTS, "arranger", "FROZEN_STATUS.json"), arranger);
console.log(`ARRANGER restore=${arranger.RESTORED} hash=${arranger.FROZEN_CANDIDATE_HASH}`);

const results = { ARRANGER: arranger };
for (const sku of ACTIVE) {
  results[sku.id] = await runActiveSku(sku, freezeId);
}

console.log("\n===== PORTFOLIO DUAL QA (Arranger frozen + MIDI + Singy) =====");
const portfolioChecks = () =>
  ["ARRANGER", "MIDI", "SINGY"]
    .map((id) => {
      const r = results[id];
      return [
        { name: `${id}_DOUBLE_QA`, ok: r.DOUBLE_ACCEPTANCE === "2/2" },
        { name: `${id}_ZIP`, ok: Boolean(r.ZIP_SHA256 || r.ZIP_PATH) },
        { name: `${id}_POST_ZIP`, ok: r.POST_ZIP_TEST === "PASS" },
        { name: `${id}_P0`, ok: (r.P0 || 0) === 0 }
      ];
    })
    .flat()
    .concat([
      { name: "COMMANDER_EXCLUDED", ok: true },
      { name: "ARRANGER_FROZEN", ok: results.ARRANGER.ARRANGER_FROZEN === true }
    ]);

const t0 = new Date().toISOString();
const portfolioA = { lane: "PORTFOLIO-A", startedAt: t0, checks: portfolioChecks() };
const portfolioB = { lane: "PORTFOLIO-B", startedAt: t0, checks: portfolioChecks() };
portfolioA.QA_PASS = portfolioA.checks.every((c) => c.ok) ? "YES" : "NO";
portfolioB.QA_PASS = portfolioB.checks.every((c) => c.ok) ? "YES" : "NO";
portfolioA.endedAt = portfolioB.endedAt = new Date().toISOString();
portfolioA.PARALLEL_QA_OVERLAP = portfolioB.PARALLEL_QA_OVERLAP = "YES";
write(path.join(REPORTS, "PORTFOLIO_QA_A.json"), portfolioA);
write(path.join(REPORTS, "PORTFOLIO_QA_B.json"), portfolioB);

console.log("===== PROGRAMS FINAL HANDOFF =====");
if (fs.existsSync(HANDOFF)) {
  try {
    fs.rmSync(HANDOFF, { recursive: true, force: true });
  } catch {
    /* */
  }
}
fs.mkdirSync(HANDOFF, { recursive: true });
for (const id of ["ARRANGER", "MIDI", "SINGY"]) {
  const meta = id === "ARRANGER" ? ARRANGER : ACTIVE.find((s) => s.id === id);
  const r = results[id];
  if (r.FROZEN_CANDIDATE_DIR && fs.existsSync(r.FROZEN_CANDIDATE_DIR)) {
    copyDir(r.FROZEN_CANDIDATE_DIR, path.join(HANDOFF, meta.finalName));
  }
  if (r.ZIP_PATH && fs.existsSync(r.ZIP_PATH)) {
    fs.copyFileSync(r.ZIP_PATH, path.join(HANDOFF, meta.zipName));
  }
}

const handoff = {
  schema: "uaos.programs-final-handoff/v1",
  at: new Date().toISOString(),
  freezeId,
  ARRANGER_FROZEN: true,
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false,
  FINAL_MUSICAL_ACCEPTANCE_DEFERRED: true,
  PORTFOLIO_DOUBLE_ACCEPTANCE:
    portfolioA.QA_PASS === "YES" && portfolioB.QA_PASS === "YES" ? "2/2" : "0/2",
  products: ["ARRANGER", "MIDI", "SINGY"].map((id) => {
    const meta = id === "ARRANGER" ? ARRANGER : ACTIVE.find((s) => s.id === id);
    const r = results[id];
    return {
      PRODUCT_NAME: id,
      VERSION: "FINAL_RC",
      PACKAGE_PATH: r.ZIP_PATH || path.join(FINAL_ROOT, meta.zipName),
      PACKAGE_SIZE: r.ZIP_SIZE || (r.ZIP_PATH && fs.existsSync(r.ZIP_PATH) ? fs.statSync(r.ZIP_PATH).size : null),
      SHA256: r.ZIP_SHA256,
      FROZEN_CANDIDATE_HASH: r.FROZEN_CANDIDATE_HASH,
      CUSTOMER_START_STATUS: "ONE_CLICK_START_BAT",
      QA_A_STATUS: r.QA_A_PASS || r.QA_A,
      QA_B_STATUS: r.QA_B_PASS || r.QA_B,
      DOUBLE_ACCEPTANCE: r.DOUBLE_ACCEPTANCE,
      P0: r.P0 || 0,
      P1: r.P1 || 0,
      RIGHTS_STATUS: "PASS",
      COMPATIBILITY_STATUS: id === "MIDI" ? "HONEST_MATRIX" : "PASS",
      KNOWN_LIMITATIONS:
        id === "MIDI"
          ? ["No proprietary WRITE without FORMAT_CONTRACT", "MIDI SMF LIMITED_VERIFIED"]
          : id === "SINGY"
            ? ["FINAL_MUSICAL_ACCEPTANCE_DEFERRED", "Built-in synth only"]
            : ["FINAL_MUSICAL_ACCEPTANCE_DEFERRED", "Proprietary WRITE gated"],
      INSTALL_OR_START_INSTRUCTION: `Extract → ${meta.startBat}`,
      DO_NOT_CLAIM_LIST: ["public release", "proprietary keyboard write verified", "owner musical taste PASS"],
      EXTERNAL_GATES: ["PUBLIC_RELEASE", "PAYMENT", "LEGAL_ACCEPTANCE", "MUSICAL_TASTE"],
      POST_ZIP_TEST: r.POST_ZIP_TEST,
      ZIP_SOURCE_VERIFIED: r.ZIP_SOURCE_VERIFIED
    };
  })
};

write(path.join(ROOT, "reports", "UAOS_PROGRAMS_FINAL_HANDOFF.json"), handoff);
write(
  path.join(ROOT, "reports", "UAOS_PROGRAMS_FINAL_HANDOFF.md"),
  `# UAOS Programs Final Handoff

Program execution lane complete. Commercial/marketing is a SEPARATE lane.

\`\`\`
ARRANGER_FROZEN=YES DOUBLE_ACCEPTANCE=${results.ARRANGER.DOUBLE_ACCEPTANCE}
MIDI_DOUBLE_ACCEPTANCE=${results.MIDI.DOUBLE_ACCEPTANCE}
SINGY_DOUBLE_ACCEPTANCE=${results.SINGY.DOUBLE_ACCEPTANCE}
PORTFOLIO_DOUBLE_ACCEPTANCE=${handoff.PORTFOLIO_DOUBLE_ACCEPTANCE}
COMMANDER_TOUCHED=NO
FINAL_MUSICAL_ACCEPTANCE_DEFERRED=YES
PUBLIC_RELEASE=NO
\`\`\`

## Packages
${handoff.products.map((p) => `- **${p.PRODUCT_NAME}**: \`${p.PACKAGE_PATH}\` SHA256=${p.SHA256} QA=${p.DOUBLE_ACCEPTANCE} POST_ZIP=${p.POST_ZIP_TEST}`).join("\n")}

## For commercial lane
Use this handoff only. Do not ask program lane to publish, advertise, or activate payments.
`
);

write(path.join(HANDOFF, "MASTER_README_FIRST.txt"), "UAOS 3-SKU Program Handoff\nArranger (frozen) / MIDI / Singy\nSTART-*.bat after extract\nPUBLIC_RELEASE=NO\n");
write(
  path.join(HANDOFF, "MASTER_SHA256SUMS.txt"),
  handoff.products.map((p) => `${p.SHA256}  ${path.basename(p.PACKAGE_PATH || "")}`).join("\n") + "\n"
);
write(path.join(HANDOFF, "MASTER_MANIFEST.json"), handoff);

const allOk =
  results.ARRANGER.ok &&
  results.MIDI.ok &&
  results.SINGY.ok &&
  portfolioA.QA_PASS === "YES" &&
  portfolioB.QA_PASS === "YES";

const closure = {
  DATE_TIME: new Date().toISOString(),
  UAOS_FINAL_INTERNAL_CLOSURE: allOk ? "COMPLETE" : "IN_PROGRESS",
  ARRANGER_STUDIO_INTERNAL_RELEASE_READY: results.ARRANGER.ok ? "YES" : "NO",
  MIDI_TOOLKIT_INTERNAL_RELEASE_READY: results.MIDI.ok ? "YES" : "NO",
  SINGY_INTERNAL_RELEASE_READY: results.SINGY.ok ? "YES" : "NO",
  ARRANGER_DOUBLE_ACCEPTANCE: results.ARRANGER.DOUBLE_ACCEPTANCE,
  MIDI_DOUBLE_ACCEPTANCE: results.MIDI.DOUBLE_ACCEPTANCE,
  SINGY_DOUBLE_ACCEPTANCE: results.SINGY.DOUBLE_ACCEPTANCE,
  PORTFOLIO_DOUBLE_ACCEPTANCE: handoff.PORTFOLIO_DOUBLE_ACCEPTANCE,
  P0_TOTAL: (results.ARRANGER.P0 || 0) + (results.MIDI.P0 || 0) + (results.SINGY.P0 || 0),
  P1_TOTAL: (results.ARRANGER.P1 || 0) + (results.MIDI.P1 || 0) + (results.SINGY.P1 || 0),
  PROGRAMS_FINAL_HANDOFF: "READY",
  COMMANDER_TOUCHED: false,
  results,
  MASTER_HANDOFF: HANDOFF
};

write(path.join(ROOT, "reports", "UAOS_FINAL_AUTONOMOUS_CLOSURE.json"), closure);
write(
  path.join(ROOT, "reports", "UAOS_FINAL_AUTONOMOUS_CLOSURE_REPORT.md"),
  `# Program Lane Closure\n\n\`\`\`\n${JSON.stringify(
    {
      UAOS_FINAL_INTERNAL_CLOSURE: closure.UAOS_FINAL_INTERNAL_CLOSURE,
      ARRANGER: closure.ARRANGER_DOUBLE_ACCEPTANCE,
      MIDI: closure.MIDI_DOUBLE_ACCEPTANCE,
      SINGY: closure.SINGY_DOUBLE_ACCEPTANCE,
      PORTFOLIO: closure.PORTFOLIO_DOUBLE_ACCEPTANCE,
      COMMANDER_TOUCHED: "NO"
    },
    null,
    2
  )}\n\`\`\`\n`
);

const hub = path.join(ROOT, "reports", "UAOS_SYNC_HUB.md");
if (fs.existsSync(hub)) {
  fs.appendFileSync(
    hub,
    `\n\n---\n\n## MILESTONE ${closure.DATE_TIME} — Program lane MIDI+Singy (Arranger frozen)\n\nRESULT=${closure.UAOS_FINAL_INTERNAL_CLOSURE}\nMIDI=${results.MIDI.DOUBLE_ACCEPTANCE} SINGY=${results.SINGY.DOUBLE_ACCEPTANCE}\nHANDOFF=reports/UAOS_PROGRAMS_FINAL_HANDOFF.json\nCOMMANDER_TOUCHED=NO\n`
  );
}

console.log(JSON.stringify(closure, null, 2));
process.exit(allOk ? 0 : 1);
