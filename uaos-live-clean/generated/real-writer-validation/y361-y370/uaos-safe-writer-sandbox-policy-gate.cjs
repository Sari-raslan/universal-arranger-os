const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y361-y370", "y361-y370-writer-sandbox-policy-report.json");

function fail(msg) {
  console.error("[Y361-Y370 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing policy report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y361-Y370") fail("Wrong phase");
if (r.status !== "PASS_POLICY_ONLY") fail("Bad status");
if (r.policyOnly !== true) fail("Not policy-only");
if (r.writerImplemented !== false) fail("Writer implementation detected");
if (r.realOutputProduced !== false) fail("Real output detected");
if (r.outputSandboxCreated !== false) fail("Output sandbox folder should not be created in this phase");

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
  path.join(process.cwd(), "generated", "real-writer-validation", "y361-y370", "y361-y370-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y361-Y370",
    status: "PASS",
    confirmed: [
      "POLICY_ONLY",
      "NO_OUTPUT_SANDBOX_CREATION",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y361-Y370 SAFETY PASS]");
