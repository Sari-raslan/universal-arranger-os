const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y821-y830", "y821-y830-approval-text-scope-report.json");

function fail(msg){ console.error("[Y821-Y830 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y821-Y830") fail("Wrong phase");
if (r.status !== "PASS_APPROVAL_TEXT_SCOPE_READY") fail("Bad status");
if (r.approvalText.approvalStatusNow !== "NOT_APPROVED") fail("Approval must be NOT_APPROVED");

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
  path.join(appRoot, "generated", "real-writer-validation", "y821-y830", "y821-y830-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y821-Y830",
    status: "PASS",
    confirmed: [
      "APPROVAL_TEXT_READY",
      "APPROVAL_STATUS_NOT_APPROVED",
      "APPROVAL_SCOPE_READY",
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

console.log("[Y821-Y830 SAFETY PASS]");
