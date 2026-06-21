const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y891-y900", "y891-y900-final-governance-report.json");

function fail(msg){ console.error("[Y891-Y900 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final governance report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y891-Y900") fail("Wrong phase");
if (r.status !== "PASS_FINAL_PRE_WRITER_GOVERNANCE_READY_NO_GO") fail("Bad status");

const a = r.approvalSummary || {};
const f = r.finalGovernance || {};
if (a.approvalRequired !== true) fail("Approval required must be true");
if (a.currentApprovalState !== "NOT_APPROVED") fail("Current approval must be NOT_APPROVED");
if (a.releasePosture !== "NO_GO") fail("Approval summary posture must be NO_GO");
if (a.finalRule !== "DO NOT IMPLEMENT UNTIL APPROVED") fail("Final rule missing");

if (f.overallState !== "PREWRITER_GOVERNANCE_READY_IMPLEMENTATION_BLOCKED") fail("Overall state incorrect");
if (f.releasePosture !== "NO_GO") fail("Final release posture must be NO_GO");
if (f.finalRule !== "DO_NOT_IMPLEMENT_UNTIL_APPROVED") fail("Final governance rule incorrect");
if (f.implementationIntentionallyBlocked !== true) fail("Implementation blocked flag failed");

const finalState = f.finalState || {};
if (finalState.prewriterGovernance !== "READY") fail("Prewriter governance not ready");
if (finalState.implementation !== "BLOCKED") fail("Implementation not blocked");
if (finalState.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (finalState.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (finalState.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (finalState.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (finalState.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (finalState.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (finalState.appJsxModified !== false) fail("App.jsx flag failed");
if (finalState.approvalRequired !== true) fail("Approval required flag failed");
if (finalState.goNoGo !== "NO_GO") fail("Go/No-Go not NO_GO");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Safety writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Safety real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Safety real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Safety production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Safety deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Safety fixtures not blocked");
if (s.appJsxModified !== false) fail("Safety App.jsx failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "specs", "pre-writer-governance"),
  path.join(appRoot, "reports", "pre-writer-governance"),
  path.join(appRoot, "public", "governance", "y861-y900")
];

function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

for (const root of roots) {
  for (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase();
    if (forbiddenOutputExt.includes(ext)) fail("Forbidden output file exists: " + file);
  }
}

for (const file of [
  "public/governance/y861-y900/cto-decision-report.html",
  "public/governance/y861-y900/governance-dashboard.html",
  "public/governance/y861-y900/do-not-implement-gate.html",
  "public/governance/y861-y900/final-governance-report.html",
  "public/governance/final-governance-report.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing public page: " + file);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y891-y900", "y891-y900-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y891-Y900",
    status: "PASS",
    confirmed: [
      "FINAL_PRE_WRITER_GOVERNANCE_READY",
      "RELEASE_POSTURE_NO_GO",
      "DO_NOT_IMPLEMENT_UNTIL_APPROVED",
      "APPROVAL_REQUIRED",
      "NO_WRITER_IMPLEMENTATION",
      "NO_REAL_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES_TOUCH",
      "NO_APP_JSX",
      "NO_FORBIDDEN_OUTPUT_FILES_CREATED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y891-Y900 FINAL SAFETY PASS]");
