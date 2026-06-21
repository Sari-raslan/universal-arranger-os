const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y401-y420", "y401-y420-dryrun-writer-simulator-report.json");

function fail(msg) {
  console.error("[Y401-Y420 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing simulator report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y401-Y420") fail("Wrong phase");
if (r.status !== "PASS_DRYRUN_SIMULATOR_READY") fail("Bad status");
if (r.dryRunOnly !== true) fail("Not dry-run only");
if (r.existingReportsOnly !== true) fail("Not existing reports only");
if (r.realWriterImplemented !== false) fail("Real writer detected");
if (r.realKeyboardOutputProduced !== false) fail("Real output detected");

for (const k of ["appJsxModified","fixtureRead","fixtureCopy","fixtureModify","productionParser","realWriterImplementation","realStyOutput","realKeyboardOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

for (const plan of r.dryRunPlans || []) {
  if (plan.wouldCreateKeyboardFile !== false) fail("Plan would create keyboard file");
  if (plan.wouldUseRealExtension !== false) fail("Plan would use real extension");
  if (!String(plan.proposedManifestName || "").endsWith(".json")) fail("Manifest is not JSON");
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y401-y420", "y401-y420-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y401-Y420",
    status: "PASS",
    confirmed: [
      "DRY_RUN_ONLY",
      "EXISTING_REPORTS_ONLY",
      "NO_FIXTURE_READ",
      "NO_REAL_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_DEPLOY",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y401-Y420 SAFETY PASS]");
