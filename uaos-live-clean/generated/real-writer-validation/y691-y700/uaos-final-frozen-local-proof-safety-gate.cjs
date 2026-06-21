const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const reportPath = path.join(base, "y691-y700", "y691-y700-final-frozen-local-proof-gate-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-final-frozen-local-proof-gate.html");

function fail(msg) {
  console.error("[Y691-Y700 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing final frozen proof report");
if (!fs.existsSync(htmlPath)) fail("Missing final frozen proof HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};
const f = r.finalState || {};

if (r.phase !== "Y691-Y700") fail("Wrong phase");
if (r.status !== "PASS_FROZEN_LOCAL_PROOF_READY") fail("Bad status");
if (r.frozenState !== true) fail("Frozen state not true");

if (f.frozenLocalProof !== "READY") fail("Frozen local proof not ready");
if (f.qaFreezeDashboard !== "READY") fail("QA freeze dashboard not ready");
if (f.handoverSummary !== "READY") fail("Handover not ready");
if (f.writer !== "BLOCKED") fail("Writer not blocked");
if (f.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (f.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (f.deploy !== "BLOCKED") fail("Deploy not blocked");
if (f.appJsxModified !== false) fail("App.jsx flag failed");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(base, "y691-y700", "y691-y700-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y691-Y700",
    status: "PASS",
    confirmed: [
      "FROZEN_LOCAL_PROOF_READY",
      "QA_FREEZE_COMPLETE",
      "HANDOVER_READY",
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

console.log("[Y691-Y700 FINAL SAFETY PASS]");
