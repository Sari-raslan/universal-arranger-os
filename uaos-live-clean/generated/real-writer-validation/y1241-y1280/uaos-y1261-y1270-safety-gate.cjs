const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1241-y1280", "y1261-y1270-official-path-dashboard-report.json");

function fail(msg){ console.error("[Y1261-Y1270 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing official path dashboard report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1261-Y1270") fail("Wrong phase");
if (r.status !== "PASS_OFFICIAL_PATH_DASHBOARD_READY") fail("Bad status");
if (r.dashboard.selectedPath !== "PATH-DOCS-UI") fail("Selected path mismatch");
if (r.dashboard.pathStatus !== "LOCKED") fail("Path must be locked");

const locks = r.dashboard.finalLocks || {};
if (locks.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (locks.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (locks.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (locks.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (locks.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (locks.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (locks.appJsxModified !== false) fail("App.jsx flag failed");
if (locks.operationalCode !== "NO") fail("Operational code not blocked");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1241-y1280", "y1261-y1270-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1261-Y1270",
    status: "PASS",
    confirmed: [
      "OFFICIAL_PATH_DASHBOARD_READY",
      "PATH_DOCS_UI_LOCKED",
      "NO_WRITER",
      "NO_OUTPUT",
      "NO_OPERATIONAL_CODE"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1261-Y1270 SAFETY PASS]");
