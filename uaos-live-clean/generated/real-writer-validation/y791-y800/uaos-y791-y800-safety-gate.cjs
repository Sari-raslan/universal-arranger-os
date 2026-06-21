const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y791-y800", "y791-y800-hw-sw-failure-modes-report.json");

function fail(msg){ console.error("[Y791-Y800 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y791-Y800") fail("Wrong phase");
if (r.status !== "PASS_HW_SW_FAILURE_MODES_READY") fail("Bad status");

const s = r.safety || {};
if (s.writer !== "BLOCKED") fail("Writer not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.designOnly !== true) fail("Design-only flag failed");

if (!Array.isArray(r.hwSwChecklist.checklist) || r.hwSwChecklist.checklist.length < 7) fail("Checklist too short");
if (!Array.isArray(r.failureModes.modes) || r.failureModes.modes.length < 8) fail("Failure modes too short");

const critical = r.failureModes.modes.filter(x => x.severity === "CRITICAL");
if (critical.length < 6) fail("Critical failure coverage too weak");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "specs", "conformance"),
  path.join(appRoot, "reports", "conformance"),
  path.join(appRoot, "public", "governance", "y781-y820")
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
  path.join(appRoot, "generated", "real-writer-validation", "y791-y800", "y791-y800-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y791-Y800",
    status: "PASS",
    confirmed: [
      "HW_SW_CHECKLIST_DESIGN_READY",
      "FAILURE_MODES_DESIGN_READY",
      "NO_WRITER",
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

console.log("[Y791-Y800 SAFETY PASS]");
