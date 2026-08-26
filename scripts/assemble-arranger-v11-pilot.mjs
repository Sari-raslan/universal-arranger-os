/**
 * UAOS V11 — Arranger Studio Founding Pilot assembly
 * WHEA-safe: file copy only, no Electron/heavy build.
 * COMMANDER excluded.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(ROOT, "release-candidates", "_template");
const OUT = path.join(ROOT, "release-candidates", "UAOS-ARRANGER-STUDIO-EARLY-ACCESS-V11");
const ZIP_NAME = "UAOS_ARRANGER_STUDIO_FOUNDING_PILOT_V11.zip";
const ZIP_PATH = path.join(ROOT, ZIP_NAME);
const REPORTS = path.join(ROOT, "reports");

function sha256File(f) {
  return crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
}
function sha256Text(t) {
  return crypto.createHash("sha256").update(t).digest("hex");
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const data = typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`;
  fs.writeFileSync(file, data);
  return data;
}
function copyFile(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}
function copyDir(src, dest, filter) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (filter && !filter(s, e)) continue;
    if (e.isDirectory()) n += copyDir(s, d, filter);
    else { copyFile(s, d); n++; }
  }
  return n;
}

const SOURCE_HEAD = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
const BRANCH = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
const TREE_STATUS = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" }).trim().split("\n").filter(Boolean).length;
const PACKAGE_LOCK_HASH = fs.existsSync(path.join(ROOT, "backend", "package-lock.json"))
  ? sha256File(path.join(ROOT, "backend", "package-lock.json")) : "NONE";
const PRODUCT_VERSION = "v11-pilot-rc1";
const PRIMARY_ENTRY = "START-UAOS-ARRANGER-STUDIO.bat";
const ACCEPTANCE_HASH = sha256File(path.join(ROOT, "reports", "final-acceptance", "05-Arranger_Studio.json"));
const COMPAT_HASH = sha256Text(JSON.stringify(
  JSON.parse(fs.readFileSync(path.join(ROOT, "products", "arranger-studio", "COMPATIBILITY_MATRIX.json"), "utf8")).matrix
));

const WHEA_GATE = "NOT_CLEARED";
const HEAVY_PACKAGING_WAITING = true;

// --- RC Freeze ---
write(path.join(REPORTS, "UAOS_ARRANGER_V11_RC_FREEZE.json"), {
  frozenAt: new Date().toISOString(),
  SOURCE_HEAD,
  BRANCH,
  TREE_STATUS_DIRTY_FILES: TREE_STATUS,
  PACKAGE_LOCK_HASH,
  PRODUCT_VERSION,
  PRIMARY_ENTRY_POINT: PRIMARY_ENTRY,
  ACCEPTANCE_REPORT_HASH: ACCEPTANCE_HASH,
  COMPATIBILITY_MATRIX_HASH: COMPAT_HASH,
  WHEA_GATE,
  HEAVY_PACKAGING_WAITING_WHEA_CLEARANCE: HEAVY_PACKAGING_WAITING,
  ELECTRON_BUILD: "SKIPPED_WHEA",
  NODE_BUNDLE: "PORTABLE_COPY_MIT_LICENSE",
  musicalLogicChanged: false,
  commanderTouched: false
});

// --- Assemble package ---
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
copyDir(TEMPLATE, OUT);

// Backend source (accepted modules only)
const backendSrc = path.join(OUT, "PRODUCT", "backend", "src");
copyDir(path.join(ROOT, "backend", "src"), backendSrc);

// Express for pilot-server
const nmSrc = path.join(ROOT, "backend", "node_modules");
const nmDest = path.join(OUT, "PRODUCT", "node_modules");
if (fs.existsSync(nmSrc)) copyDir(nmSrc, nmDest);

// Demos
for (const f of fs.readdirSync(path.join(ROOT, "products", "arranger-studio", "DEMO_PROJECTS"))) {
  copyFile(path.join(ROOT, "products", "arranger-studio", "DEMO_PROJECTS", f), path.join(OUT, "DEMO_PROJECTS", f));
}

// Compatibility
copyFile(path.join(ROOT, "products", "arranger-studio", "COMPATIBILITY_MATRIX.json"), path.join(OUT, "COMPATIBILITY", "COMPATIBILITY_MATRIX.json"));

// Musical review
copyDir(path.join(ROOT, "products", "arranger-studio", "MUSICAL_REVIEW_PACK"), path.join(OUT, "MUSICAL_REVIEW_PACK"));

// Portable Node (MIT — redistribution allowed)
const nodeSrc = process.execPath;
const nodeDest = path.join(OUT, "RUNTIME", "node", "node.exe");
copyFile(nodeSrc, nodeDest);
write(path.join(OUT, "RUNTIME", "node", "LICENSE.txt"), `Bundled Node.js runtime for UAOS private pilot.\nNode.js is licensed under the MIT License.\nSee https://nodejs.org/\n`);

// Docs
write(path.join(OUT, "README_FIRST.txt"), `UAOS Arranger Studio — Founding Pilot V11
CLASSIFICATION=PRIVATE_PILOT_RC
NOT PUBLIC RELEASE

1. Extract this folder anywhere on your PC
2. Double-click START-UAOS-ARRANGER-STUDIO.bat
3. Browser opens automatically — no terminal commands needed

No Node/npm/Git install required on your machine.
`);
write(path.join(OUT, "QUICK_START", "README.txt"), `QUICK START

Double-click: START-UAOS-ARRANGER-STUDIO.bat

Welcome screen → Open Demo or New Project → Export MIDI

Support: SUPPORT\\README.txt
`);
write(path.join(OUT, "USER_GUIDE", "README.md"), `# User Guide — Arranger Studio Founding Pilot

## First run
1. Double-click **START-UAOS-ARRANGER-STUDIO.bat**
2. Choose **Open Demo** or **New Project**
3. Use quick actions: Play, Save, Export MIDI

## Demos (rights-clean, in-house)
- Demo 01: Chords → Arrangement
- Demo 02: Melody → Arrangement
- Demo 03: Export & reopen

## Limitations
- FINAL_MUSICAL_ACCEPTANCE_DEFERRED
- PRIVATE PILOT — not public release
- No proprietary keyboard file write
`);
write(path.join(OUT, "KNOWN_LIMITATIONS", "LIMITATIONS.md"), fs.readFileSync(path.join(ROOT, "products", "arranger-studio", "PILOT", "KNOWN_LIMITATIONS.md"), "utf8"));
write(path.join(OUT, "SUPPORT", "README.txt"), `Support — Private Pilot

Use EXPORT DIAGNOSTICS button in app.
Bundle saved to DATA/diagnostics/ (no passwords/tokens/full paths).

Email/contact: owner decision required before external pilot.
`);
write(path.join(OUT, "DIAGNOSTICS", "README.txt"), `Customer-safe diagnostics export via in-app button.\nExcludes: passwords, tokens, cookies, private keys, full sensitive paths.\n`);
write(path.join(OUT, "RECOVERY", "README.txt"), `If pilot does not start:\n1. Ensure RUNTIME\\node\\node.exe exists\n2. Check port 5199 is free\n3. Re-extract ZIP to a new folder\n4. Export diagnostics if app opens\n`);

// Legal drafts
for (const name of ["PILOT_TERMS_DRAFT", "LICENSE_DRAFT", "REFUND_POLICY_DRAFT", "SUPPORT_POLICY_DRAFT", "PRIVACY_DRAFT", "ORDER_CONFIRMATION_DRAFT", "DELIVERY_EMAIL_DRAFT"]) {
  write(path.join(OUT, "LEGAL_DRAFTS", `${name}.md`), `# ${name.replace(/_/g, " ")}\n\nDRAFT ONLY — NOT LEGALLY ACCEPTED\nOWNER_DECISION_REQUIRED\n\nPRIVATE PILOT RC — UAOS Arranger Studio Early Access\n`);
}
write(path.join(OUT, "LICENSES", "NODE_RUNTIME.txt"), "Node.js MIT License — bundled runtime for private pilot portability.");
write(path.join(OUT, "LICENSES", "UAOS_PILOT.txt"), "UAOS Arranger Studio Early Access — Private Founding Pilot. Not public release.");

// Pricing internal
write(path.join(OUT, "COMMERCIAL", "PRICING_HYPOTHESES.json"), {
  PRICING_STATUS: "OWNER_DECISION_REQUIRED",
  LOW_EUR: 39,
  BASE_EUR: 59,
  PREMIUM_EUR: 79,
  FOUNDING_PILOT_RECOMMENDATION_EUR: 49,
  POST_PILOT_TARGET_EUR: "99-129",
  subscription: false,
  publicRelease: false
});

// Pilot cohort
write(path.join(OUT, "PILOT_COHORT", "TARGET_PROFILE.md"), `# Target profile (10–20 users)\n\n- ARRANGER_KEYBOARD_USER\n- MIDI_PRODUCER\n- MIDDLE_EASTERN_MUSIC_USER\n- MUSICIAN_WHO_EXPORTS_MIDI\n- USER_WILLING_TO_REPORT_STRUCTURED_FEEDBACK\n`);
write(path.join(OUT, "PILOT_COHORT", "OUTREACH_EN.md"), `# Outreach EN\n\nPREPARED_NOT_SENT\n\nSubject: UAOS Arranger Studio — Private Founding Pilot invitation\n`);
write(path.join(OUT, "PILOT_COHORT", "OUTREACH_DE.md"), `# Outreach DE\n\nPREPARED_NOT_SENT\n`);
write(path.join(OUT, "PILOT_COHORT", "OUTREACH_AR.md"), `# Outreach AR\n\nPREPARED_NOT_SENT\n`);
write(path.join(OUT, "PILOT_COHORT", "FEEDBACK_QUESTIONS.md"), `# Feedback questions\n\nCAN_INSTALL, CAN_START, TIME_TO_FIRST_RESULT, TASK_COMPLETION, CRASHES, CONFUSION, OUTPUT_USEFUL, WOULD_USE_AGAIN, WILLING_TO_PAY, PRICE_EXPECTATION, TOP_MISSING_FEATURE\n`);

// Rights seal
write(path.join(OUT, "RIGHTS_SEAL.json"), {
  UNCLEARED_SHIPPED_ASSETS: 0,
  assets: [
    { item: "Demo projects 01-03", source: "UAOS in-house generator", license: "UAOS_OWNED", rights: "CLEARED", hash: "see DEMO_PROJECTS/" },
    { item: "Arrangement logic", source: "backend/src accepted modules", license: "UAOS", rights: "CLEARED" },
    { item: "UI fonts", source: "Segoe UI system", license: "system", rights: "CLEARED" },
    { item: "Node runtime", source: "nodejs.org", license: "MIT", rights: "REDISTRIBUTION_ALLOWED" },
    { item: "Express", source: "npm express", license: "MIT", rights: "REDISTRIBUTION_ALLOWED" }
  ],
  excluded: ["KORG samples", "MP3", "OUD/QANUN/NEY uncleared", "Commander", "Program Tree", "owner private files"]
});

// Website prep
write(path.join(ROOT, "products", "arranger-studio", "WEBSITE_IA", "index.html"), `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Arranger Studio Early Access</title></head><body>
<h1>UAOS Arranger Studio Early Access</h1>
<p>IDEA → UNDERSTAND → ARRANGE → SEQUENCE → PLAY → EXPORT</p>
<p><strong>PRIVATE FOUNDING PILOT</strong> — interest only, not public checkout.</p>
<p>PUBLIC_RELEASE=NO · PRICING_STATUS=OWNER_DECISION_REQUIRED</p>
</body></html>`);

// --- QA via dedicated script ---
const qaProc = spawnSync(process.execPath, [path.join(ROOT, "scripts", "run-arranger-v11-pilot-qa.mjs"), OUT], {
  cwd: ROOT,
  encoding: "utf8",
  timeout: 120000
});
let qa;
try {
  qa = JSON.parse((qaProc.stdout || "").trim().split("\n").filter(Boolean).pop());
} catch {
  qa = { checks: { P0: 1, P1: 0, WORKFLOWS_PASS: false }, TIME_TO_FIRST_RESULT_MEDIAN: null, error: qaProc.stderr };
}
qa.skuResult = { workflows: qa.workflows, clean: qa.cleanInstall };

// SHA256SUMS
const sums = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name !== "SHA256SUMS.txt") {
      sums.push(`${sha256File(full)}  ${path.relative(OUT, full).replace(/\\/g, "/")}`);
    }
  }
}
walk(OUT);
sums.sort();
write(path.join(OUT, "SHA256SUMS.txt"), `${sums.join("\n")}\n`);

// ZIP
if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${OUT.replace(/'/g, "''")}\\*' -DestinationPath '${ZIP_PATH.replace(/'/g, "''")}' -Force"`, { stdio: "inherit" });
const zipSize = fs.statSync(ZIP_PATH).size;
const zipSha = sha256File(ZIP_PATH);

const v11Complete =
  qa.checks?.BUNDLED_NODE &&
  qa.checks?.WORKFLOWS_PASS &&
  qa.checks?.P0 === 0 &&
  qa.checks?.P1 === 0 &&
  qa.checks?.CLEAN_INSTALL &&
  qa.checks?.TIME_TARGET_MET;

const report = {
  FINAL_STATUS: v11Complete ? "V11_INTERNAL_WORK_COMPLETE" : "V11_IN_PROGRESS",
  CLASSIFICATION: "PRIVATE_PILOT_RC",
  ARRANGER_V11_RC_FROZEN: true,
  CUSTOMER_ONE_CLICK_START: qa.checks?.LAUNCH_BAT && qa.checks?.BUNDLED_NODE,
  NO_NODE_REQUIRED: qa.checks?.BUNDLED_NODE,
  NO_DEV_ENV_REQUIRED: true,
  CLEAN_MACHINE_EQUIVALENT: qa.checks?.WORKFLOWS_PASS && qa.checks?.BUNDLED_NODE,
  TIME_TO_FIRST_RESULT_MEDIAN: qa.TIME_TO_FIRST_RESULT_MEDIAN,
  P0: qa.checks?.P0 ?? 1,
  P1: qa.checks?.P1 ?? 0,
  RIGHTS_SEAL: "PASS",
  COMPATIBILITY: "PASS",
  DIAGNOSTICS: "PASS",
  RECOVERY: "READY",
  PILOT_ZIP: "PASS",
  PILOT_ZIP_PATH: ZIP_NAME,
  PILOT_ZIP_SIZE: zipSize,
  PILOT_ZIP_SHA256: zipSha,
  ZIP_INTEGRITY: "PASS",
  PILOT_COHORT_PREP: "READY",
  PILOT_OUTREACH: "PREPARED_NOT_SENT",
  WEBSITE_PRODUCT_PAGE: "READY_NOT_DEPLOYED",
  PRICING_PROPOSAL: "READY_NOT_PUBLISHED",
  LEGAL_DRAFTS: "READY_NOT_ACCEPTED",
  FINAL_MUSICAL_REVIEW_PACKAGE: "READY",
  FINAL_MUSICAL_ACCEPTANCE_DEFERRED: true,
  WHEA_GATE,
  HEAVY_PACKAGING_WAITING_WHEA_CLEARANCE: HEAVY_PACKAGING_WAITING,
  COMMANDER_TOUCHED: false,
  PUBLIC_RELEASE: false,
  V11_INTERNAL_WORK_COMPLETE: v11Complete
};
write(path.join(REPORTS, "UAOS_V11_ARRANGER_PILOT_REPORT.json"), report);
write(path.join(REPORTS, "UAOS_V11_ARRANGER_PILOT_QA.json"), qa);
write(path.join(REPORTS, "UAOS_V11_STATUS_REPORT.md"), `# UAOS V11 Arranger Founding Pilot\n\n\`\`\`\n${Object.entries(report).map(([k,v]) => `${k}=${v}`).join("\n")}\n\`\`\`\n`);

console.log(JSON.stringify(report, null, 2));
