const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y391-y400", "y391-y400-final-writer-readiness-dashboard-report.json");

function fail(msg) {
  console.error("[Y391-Y400 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing writer readiness report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};
const v = r.finalVerdict || {};

if (r.phase !== "Y391-Y400") fail("Wrong phase");
if (r.status !== "PASS_WRITER_NOT_READY_BUT_POLICY_READY") fail("Bad status");
if (v.writerReadyToImplement !== false) fail("Writer must not be ready to implement");
if (v.writerPolicyReady !== true) fail("Writer policy should be ready");
if (v.realOutputAllowed !== false) fail("Real output must not be allowed");
if (v.deployAllowed !== false) fail("Deploy must not be allowed");

for (const k of [
  "appJsxModified",
  "writerImplementation",
  "realStyOutput",
  "realKeyboardOutput",
  "productionParser",
  "fixtureModification",
  "fixtureCopy",
  "destructiveWrites",
  "deploy"
]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y391-y400", "y391-y400-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y391-Y400",
    status: "PASS",
    confirmed: [
      "WRITER_POLICY_READY",
      "WRITER_IMPLEMENTATION_NOT_READY",
      "REAL_OUTPUT_NOT_ALLOWED",
      "DESTRUCTIVE_WRITES_BLOCKED",
      "NO_APP_JSX",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y391-Y400 FINAL SAFETY PASS]");
