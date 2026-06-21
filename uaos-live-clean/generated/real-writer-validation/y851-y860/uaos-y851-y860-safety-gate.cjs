const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y851-y860", "y851-y860-final-approval-gate-report.json");

function fail(msg){ console.error("[Y851-Y860 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final approval report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y851-Y860") fail("Wrong phase");
if (r.status !== "PASS_WRITER_SANDBOX_APPROVAL_GATE_READY_NO_GO") fail("Bad status");

if (r.manualChecklist.currentApproval !== "NOT_APPROVED") fail("Manual approval must be NOT_APPROVED");
if (r.finalGate.finalDecisionNow !== "NO_GO") fail("Final decision must be NO_GO");
if (r.finalGate.sandboxOpened !== "NO") fail("Sandbox must not be opened");
if (r.finalGate.implementationAllowed !== "NO") fail("Implementation must not be allowed");
if (r.finalGate.realOutputAllowed !== "NO") fail("Real output must not be allowed");
if (r.finalGate.productionParserAllowed !== "NO") fail("Production parser must not be allowed");
if (r.finalGate.deployAllowed !== "NO") fail("Deploy must not be allowed");
if (r.finalGate.fixturesTouchAllowed !== "NO") fail("Fixtures touch must not be allowed");

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

for (const file of [
  "public/governance/y821-y860/index.html",
  "public/governance/y821-y860/risk-matrix-go-no-go.html",
  "public/governance/y821-y860/permission-rollback-freeze.html",
  "public/governance/y821-y860/final-approval-gate.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing public page: " + file);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y851-y860", "y851-y860-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y851-Y860",
    status: "PASS",
    confirmed: [
      "WRITER_SANDBOX_APPROVAL_GATE_READY",
      "FINAL_DECISION_NO_GO",
      "SANDBOX_NOT_OPENED",
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

console.log("[Y851-Y860 FINAL SAFETY PASS]");
