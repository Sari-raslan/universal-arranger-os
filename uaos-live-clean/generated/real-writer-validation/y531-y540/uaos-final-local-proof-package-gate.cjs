const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y531-y540", "y531-y540-final-local-proof-package-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-final-local-proof-package.html");

function fail(msg) {
  console.error("[Y531-Y540 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing final proof report");
if (!fs.existsSync(htmlPath)) fail("Missing final proof HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};
const f = r.finalState || {};

if (r.phase !== "Y531-Y540") fail("Wrong phase");
if (r.status !== "PASS_LOCAL_PROOF_PACKAGE_READY") fail("Bad status");

if (f.localEvidenceIndex !== "READY") fail("Evidence index not ready");
if (f.ctoSummaryDashboard !== "READY") fail("CTO summary not ready");
if (f.finalProofPackage !== "READY") fail("Final proof package not ready");
if (f.writer !== "BLOCKED") fail("Writer not blocked");
if (f.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (f.productionParser !== "BLOCKED") fail("Parser not blocked");
if (f.deploy !== "BLOCKED") fail("Deploy not blocked");
if (f.appJsxModified !== false) fail("App.jsx flag failed");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y531-y540", "y531-y540-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y531-Y540",
    status: "PASS",
    confirmed: [
      "LOCAL_PROOF_PACKAGE_READY",
      "EVIDENCE_INDEX_READY",
      "CTO_SUMMARY_READY",
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

console.log("[Y531-Y540 FINAL SAFETY PASS]");
