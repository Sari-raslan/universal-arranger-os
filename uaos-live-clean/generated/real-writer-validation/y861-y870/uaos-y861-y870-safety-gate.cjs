const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y861-y870", "y861-y870-cto-decision-report.json");

function fail(msg){ console.error("[Y861-Y870 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing CTO decision report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y861-Y870") fail("Wrong phase");
if (r.status !== "PASS_CTO_DECISION_REPORT_READY") fail("Bad status");
if (r.ctoDecision.decisionNow !== "NO_GO") fail("Decision must be NO_GO");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.governanceOnly !== true) fail("Governance-only flag failed");
if (s.approvalRequired !== true) fail("Approval-required flag failed");

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

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y861-y870", "y861-y870-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y861-Y870",
    status: "PASS",
    confirmed: [
      "CTO_DECISION_REPORT_READY",
      "DECISION_NOW_NO_GO",
      "NO_WRITER_IMPLEMENTATION",
      "NO_REAL_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES_TOUCH",
      "NO_APP_JSX",
      "APPROVAL_REQUIRED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y861-Y870 SAFETY PASS]");
