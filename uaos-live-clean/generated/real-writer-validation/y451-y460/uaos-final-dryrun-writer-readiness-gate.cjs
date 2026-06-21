const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y451-y460", "y451-y460-final-dryrun-writer-readiness-report.json");

function fail(msg) {
  console.error("[Y451-Y460 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing final readiness report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};
const v = r.finalVerdict || {};

if (r.phase !== "Y451-Y460") fail("Wrong phase");
if (r.status !== "PASS_DRYRUN_WRITER_READY_JSON_ONLY") fail("Bad status");
if (v.dryRunWriterSimulator !== "READY") fail("Dry-run simulator not ready");
if (v.dryRunJsonManifests !== "READY") fail("Dry-run manifests not ready");
if (v.extensionBlocker !== "PASS") fail("Extension blocker not pass");
if (v.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (v.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (v.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (v.deploy !== "BLOCKED") fail("Deploy not blocked");

for (const k of ["appJsxModified","fixtureCopy","fixtureModify","productionParser","realWriterImplementation","realStyOutput","realKeyboardOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y451-y460", "y451-y460-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y451-Y460",
    status: "PASS",
    confirmed: [
      "DRYRUN_WRITER_READY_JSON_ONLY",
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

console.log("[Y451-Y460 FINAL SAFETY PASS]");
