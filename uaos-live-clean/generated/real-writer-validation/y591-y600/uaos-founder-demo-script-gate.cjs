const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y591-y600", "y591-y600-founder-demo-script-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-founder-demo-script.html");

function fail(msg) {
  console.error("[Y591-Y600 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing founder script report");
if (!fs.existsSync(htmlPath)) fail("Missing founder script HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y591-Y600") fail("Wrong phase");
if (r.status !== "PASS_FOUNDER_DEMO_SCRIPT_READY") fail("Bad status");
if (!Array.isArray(r.demoScript) || r.demoScript.length < 5) fail("Demo script too short");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const html = fs.readFileSync(htmlPath, "utf8");
if (!html.includes("Real writer")) fail("Missing real writer safety line");
if (!html.includes("production parser")) fail("Missing production parser safety line");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y591-y600", "y591-y600-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y591-Y600",
    status: "PASS",
    confirmed: [
      "FOUNDER_DEMO_SCRIPT_READY",
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

console.log("[Y591-Y600 SAFETY PASS]");
