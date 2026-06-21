const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y1041-y1060", "y1041-y1060-final-readonly-simulator-dashboard-report.json");

function fail(msg){ console.error("[Y1041-Y1060 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing simulator dashboard report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1041-Y1060") fail("Wrong phase");
if (r.status !== "PASS_READONLY_SIMULATOR_DASHBOARD_READY") fail("Bad status");
if (r.verdict !== "READONLY_SIMULATOR_READY_NO_OUTPUT") fail("Verdict incorrect");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.outputAllowed !== false) fail("Output flag failed");

fs.writeFileSync(
  path.join(base, "y1041-y1060", "y1041-y1060-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1041-Y1060",
    status: "PASS",
    confirmed: [
      "READONLY_SIMULATOR_DASHBOARD_READY",
      "READONLY_SIMULATOR_READY_NO_OUTPUT",
      "NO_OUTPUT",
      "NO_WRITER",
      "NO_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1041-Y1060 SAFETY PASS]");
