const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y831-y840", "y831-y840-risk-matrix-go-no-go-report.json");

function fail(msg){ console.error("[Y831-Y840 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y831-Y840") fail("Wrong phase");
if (r.status !== "PASS_RISK_MATRIX_GO_NO_GO_READY") fail("Bad status");
if (r.goNoGo.decisionNow !== "NO_GO") fail("Go/No-Go must be NO_GO now");

if (!Array.isArray(r.riskMatrix.risks) || r.riskMatrix.risks.length < 6) fail("Risk matrix too short");
const critical = r.riskMatrix.risks.filter(x => x.severity === "CRITICAL");
if (critical.length < 5) fail("Critical risks too weak");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.approvalOnly !== true) fail("Approval-only flag failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "specs", "writer-approval"),
  path.join(appRoot, "reports", "writer-approval"),
  path.join(appRoot, "public", "governance", "y821-y860")
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
  path.join(appRoot, "generated", "real-writer-validation", "y831-y840", "y831-y840-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y831-Y840",
    status: "PASS",
    confirmed: [
      "RISK_MATRIX_READY",
      "GO_NO_GO_GATE_READY",
      "DECISION_NOW_NO_GO",
      "NO_WRITER_IMPLEMENTATION",
      "NO_REAL_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES_TOUCH",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y831-Y840 SAFETY PASS]");
