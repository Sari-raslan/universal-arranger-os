const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y441-y450", "y441-y450-extension-blocker-conformance-report.json");

function fail(msg) {
  console.error("[Y441-Y450 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing extension blocker report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};
const c = r.conformance || {};

if (r.phase !== "Y441-Y450") fail("Wrong phase");
if (r.status !== "PASS_ALL_DRYRUN_OUTPUTS_JSON_ONLY") fail("Bad status");

for (const k of ["jsonOnly","noRealKeyboardExtensions","noFixtureCopy","noFixtureModify","noProductionParser","noRealWriter","noDeploy"]) {
  if (c[k] !== true) fail("Conformance failed: " + k);
}

for (const k of ["appJsxModified","fixtureCopy","fixtureModify","productionParser","realWriterImplementation","realKeyboardOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y441-y450", "y441-y450-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y441-Y450",
    status: "PASS",
    confirmed: [
      "EXTENSION_BLOCKER_PASS",
      "JSON_ONLY",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_FIXTURE_COPY",
      "NO_FIXTURE_MODIFY",
      "NO_PRODUCTION_PARSER",
      "NO_REAL_WRITER",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y441-Y450 SAFETY PASS]");
