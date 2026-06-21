const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y491-y500", "y491-y500-final-dryrun-local-viewer-gate-report.json");

function fail(msg) {
  console.error("[Y491-Y500 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing final viewer report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};
const f = r.finalState || {};

if (r.phase !== "Y491-Y500") fail("Wrong phase");
if (r.status !== "PASS_LOCAL_VIEWER_READY") fail("Bad status");
if (f.dryRunManifestViewer !== "READY") fail("Viewer not ready");
if (f.localDemoUiPages !== "READY") fail("UI pages not ready");
if (f.dryRunWriterQaDashboard !== "READY") fail("QA dashboard not ready");
if (f.jsonOnly !== "PASS") fail("JSON only not pass");
if (f.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (f.realKeyboardOutput !== "BLOCKED") fail("Real keyboard output not blocked");
if (f.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (f.deploy !== "BLOCKED") fail("Deploy not blocked");
if (f.appJsxModified !== false) fail("App.jsx modified flag failed");

for (const k of ["appJsxModified","fixtureCopy","fixtureModify","productionParser","realWriterImplementation","realKeyboardOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y491-y500", "y491-y500-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y491-Y500",
    status: "PASS",
    confirmed: [
      "LOCAL_VIEWER_READY",
      "DRYRUN_MANIFEST_VIEWER_READY",
      "JSON_ONLY_PASS",
      "NO_REAL_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y491-Y500 FINAL SAFETY PASS]");
