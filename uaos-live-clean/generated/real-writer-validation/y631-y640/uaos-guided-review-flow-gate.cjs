const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y631-y640", "y631-y640-guided-review-flow-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-guided-review-flow.html");

function fail(msg) {
  console.error("[Y631-Y640 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing review flow report");
if (!fs.existsSync(htmlPath)) fail("Missing review flow HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y631-Y640") fail("Wrong phase");
if (!String(r.status).startsWith("PASS_REVIEW_FLOW_READY")) fail("Bad status");
if (r.stepCount < 5) fail("Review flow too short");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const html = fs.readFileSync(htmlPath, "utf8");
if (!html.includes("No writer")) fail("Missing no writer safety text");
if (!html.includes("no real keyboard output")) fail("Missing no real output safety text");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y631-y640", "y631-y640-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y631-Y640",
    status: "PASS",
    confirmed: [
      "GUIDED_REVIEW_FLOW_READY",
      "PUBLIC_HTML_ONLY",
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

console.log("[Y631-Y640 SAFETY PASS]");
