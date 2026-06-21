const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y521-y530", "y521-y530-cto-summary-dashboard-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-cto-summary-dashboard.html");

function fail(msg) {
  console.error("[Y521-Y530 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing CTO summary report");
if (!fs.existsSync(htmlPath)) fail("Missing CTO summary HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y521-Y530") fail("Wrong phase");
if (r.status !== "PASS_CTO_SUMMARY_READY") fail("Bad status");
if (r.verdict !== "LOCAL_PROOF_PACKAGE_READY") fail("Bad verdict");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

if ((r.finalLocks || {}).writer !== "BLOCKED") fail("Writer not blocked");
if ((r.finalLocks || {}).realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if ((r.finalLocks || {}).productionParser !== "BLOCKED") fail("Parser not blocked");
if ((r.finalLocks || {}).deploy !== "BLOCKED") fail("Deploy not blocked");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y521-y530", "y521-y530-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y521-Y530",
    status: "PASS",
    confirmed: [
      "CTO_SUMMARY_READY",
      "LOCAL_PROOF_PACKAGE_READY",
      "NO_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y521-Y530 SAFETY PASS]");
