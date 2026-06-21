const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y541-y550", "y541-y550-local-product-review-dashboard-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-local-product-review-dashboard.html");

function fail(msg) {
  console.error("[Y541-Y550 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing review report");
if (!fs.existsSync(htmlPath)) fail("Missing review HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y541-Y550") fail("Wrong phase");
if (r.status !== "PASS_REVIEW_DASHBOARD_READY") fail("Bad status");
if (r.reviewVerdict !== "LOCAL_REVIEW_READY") fail("Bad review verdict");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const html = fs.readFileSync(htmlPath, "utf8");
for (const phrase of ["Real Writer", "BLOCKED", "Real Keyboard Output", "Production Parser", "Deploy"]) {
  if (!html.includes(phrase)) fail("Missing safety text: " + phrase);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y541-y550", "y541-y550-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y541-Y550",
    status: "PASS",
    confirmed: [
      "REVIEW_DASHBOARD_READY",
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

console.log("[Y541-Y550 SAFETY PASS]");
