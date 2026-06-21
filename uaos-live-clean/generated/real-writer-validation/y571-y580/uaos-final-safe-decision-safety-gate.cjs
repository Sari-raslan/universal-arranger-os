const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y571-y580", "y571-y580-final-safe-decision-gate-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-final-safe-decision-gate.html");

function fail(msg) {
  console.error("[Y571-Y580 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing final decision report");
if (!fs.existsSync(htmlPath)) fail("Missing final decision HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};
const f = r.finalState || {};

if (r.phase !== "Y571-Y580") fail("Wrong phase");
if (r.status !== "PASS_SAFE_NEXT_DECISION_READY") fail("Bad status");

if (f.localReviewDashboard !== "READY") fail("Review not ready");
if (f.decisionMatrix !== "READY") fail("Matrix not ready");
if (f.ctoRecommendation !== "READY") fail("Recommendation not ready");
if (f.finalSafeDecisionGate !== "READY") fail("Final safe gate not ready");
if (f.writer !== "BLOCKED") fail("Writer not blocked");
if (f.realKeyboardOutput !== "BLOCKED") fail("Real keyboard output not blocked");
if (f.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (f.deploy !== "BLOCKED") fail("Deploy not blocked");
if (f.appJsxModified !== false) fail("App.jsx flag failed");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y571-y580", "y571-y580-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y571-Y580",
    status: "PASS",
    confirmed: [
      "SAFE_NEXT_DECISION_READY",
      "Y581_Y620_RECOMMENDED",
      "UI_POLISH_ALLOWED",
      "DRYRUN_IMPROVEMENTS_ALLOWED",
      "REAL_WRITER_BLOCKED",
      "REAL_KEYBOARD_OUTPUT_BLOCKED",
      "PRODUCTION_PARSER_BLOCKED",
      "DEPLOY_BLOCKED",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y571-Y580 FINAL SAFETY PASS]");
