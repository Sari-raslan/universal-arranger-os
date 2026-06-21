const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y611-y620", "y611-y620-final-polished-local-demo-gate-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-final-polished-local-demo-gate.html");

function fail(msg) {
  console.error("[Y611-Y620 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing final polished demo report");
if (!fs.existsSync(htmlPath)) fail("Missing final polished demo HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};
const f = r.finalState || {};

if (r.phase !== "Y611-Y620") fail("Wrong phase");
if (r.status !== "PASS_POLISHED_LOCAL_DEMO_READY") fail("Bad status");

if (f.executivePresentation !== "READY") fail("Executive presentation not ready");
if (f.founderDemoScript !== "READY") fail("Founder demo script not ready");
if (f.investorPartnerProofSummary !== "READY") fail("Investor summary not ready");
if (f.polishedLocalDemoGate !== "READY") fail("Polished demo gate not ready");
if (f.writer !== "BLOCKED") fail("Writer not blocked");
if (f.realKeyboardOutput !== "BLOCKED") fail("Real keyboard output not blocked");
if (f.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (f.deploy !== "BLOCKED") fail("Deploy not blocked");
if (f.appJsxModified !== false) fail("App.jsx modified flag failed");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y611-y620", "y611-y620-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y611-Y620",
    status: "PASS",
    confirmed: [
      "POLISHED_LOCAL_DEMO_READY",
      "EXECUTIVE_PRESENTATION_READY",
      "FOUNDER_DEMO_SCRIPT_READY",
      "INVESTOR_PARTNER_SUMMARY_READY",
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

console.log("[Y611-Y620 FINAL SAFETY PASS]");
