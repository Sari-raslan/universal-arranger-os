const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1241-y1280", "y1241-y1250-official-docs-ui-selection-report.json");

function fail(msg){ console.error("[Y1241-Y1250 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing official path selection report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1241-Y1250") fail("Wrong phase");
if (r.status !== "PASS_OFFICIAL_DOCS_UI_PATH_SELECTED") fail("Bad status");
if (r.selection.selectedPath !== "PATH-DOCS-UI") fail("Selected path must be PATH-DOCS-UI");

const s = r.safety || {};
if (s.selectedPath !== "PATH-DOCS-UI") fail("Safety selected path mismatch");
if (s.pathLocked !== true) fail("Path lock failed");
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.outputAllowed !== false) fail("Output flag failed");
if (s.operationalCode !== "NO") fail("Operational code flag failed");
if (s.docsOnly !== true) fail("Docs-only flag failed");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1241-y1280", "y1241-y1250-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1241-Y1250",
    status: "PASS",
    confirmed: [
      "PATH_DOCS_UI_SELECTED",
      "PATH_LOCKED",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX",
      "NO_OPERATIONAL_CODE"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1241-Y1250 SAFETY PASS]");
