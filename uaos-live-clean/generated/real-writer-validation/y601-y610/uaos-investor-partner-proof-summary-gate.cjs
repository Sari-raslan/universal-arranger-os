const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y601-y610", "y601-y610-investor-partner-proof-summary-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-investor-partner-proof-summary.html");

function fail(msg) {
  console.error("[Y601-Y610 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing investor/partner report");
if (!fs.existsSync(htmlPath)) fail("Missing investor/partner HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y601-Y610") fail("Wrong phase");
if (r.status !== "PASS_INVESTOR_PARTNER_SUMMARY_READY") fail("Bad status");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

for (const item of ["No real writer.", "No real keyboard output.", "No production parser.", "No deploy."]) {
  if (!r.proofSummary.notReadyYet.includes(item)) fail("Missing not-ready item: " + item);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y601-y610", "y601-y610-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y601-Y610",
    status: "PASS",
    confirmed: [
      "INVESTOR_PARTNER_SUMMARY_READY",
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

console.log("[Y601-Y610 SAFETY PASS]");
