const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y871-y880", "y871-y880-governance-dashboard-blockers-report.json");

function fail(msg){ console.error("[Y871-Y880 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing governance dashboard report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y871-Y880") fail("Wrong phase");
if (r.status !== "PASS_GOVERNANCE_DASHBOARD_BLOCKERS_READY") fail("Bad status");
if (r.governanceDashboard.overallPosture !== "NO_GO_UNTIL_APPROVED") fail("Overall posture must be NO_GO_UNTIL_APPROVED");
if (r.blockerMatrix.goNoGo !== "NO_GO") fail("Blocker matrix must be NO_GO");
if (r.blockerMatrix.allGreen !== false) fail("allGreen must be false");

if (!Array.isArray(r.blockerMatrix.blockers) || r.blockerMatrix.blockers.length < 7) fail("Blocker matrix too short");
const critical = r.blockerMatrix.blockers.filter(x => x.severity === "CRITICAL");
if (critical.length < 6) fail("Critical blocker coverage too weak");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.governanceOnly !== true) fail("Governance-only flag failed");

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
  path.join(appRoot, "generated", "real-writer-validation", "y871-y880", "y871-y880-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y871-Y880",
    status: "PASS",
    confirmed: [
      "GOVERNANCE_DASHBOARD_READY",
      "PRE_WRITER_BLOCKER_MATRIX_READY",
      "OVERALL_POSTURE_NO_GO_UNTIL_APPROVED",
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

console.log("[Y871-Y880 SAFETY PASS]");
