const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y651-y660", "y651-y660-final-ui-navigation-polish-gate-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-final-ui-navigation-polish-gate.html");

function fail(msg) {
  console.error("[Y651-Y660 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing final navigation polish report");
if (!fs.existsSync(htmlPath)) fail("Missing final navigation polish HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};
const f = r.finalState || {};

if (r.phase !== "Y651-Y660") fail("Wrong phase");
if (r.status !== "PASS_LOCAL_UI_NAVIGATION_POLISHED") fail("Bad status");

if (f.navigationHub !== "READY") fail("Navigation hub not ready");
if (f.guidedReviewFlow !== "READY") fail("Guided review flow not ready");
if (f.demoChecklist !== "READY") fail("Demo checklist not ready");
if (f.finalNavigationPolishGate !== "READY") fail("Final gate not ready");
if (f.writer !== "BLOCKED") fail("Writer not blocked");
if (f.realKeyboardOutput !== "BLOCKED") fail("Real keyboard output not blocked");
if (f.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (f.deploy !== "BLOCKED") fail("Deploy not blocked");
if (f.appJsxModified !== false) fail("App.jsx modified flag failed");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y651-y660", "y651-y660-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y651-Y660",
    status: "PASS",
    confirmed: [
      "LOCAL_UI_NAVIGATION_POLISHED",
      "NAVIGATION_HUB_READY",
      "GUIDED_REVIEW_FLOW_READY",
      "DEMO_CHECKLIST_READY",
      "NO_APP_JSX",
      "NO_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y651-Y660 FINAL SAFETY PASS]");
