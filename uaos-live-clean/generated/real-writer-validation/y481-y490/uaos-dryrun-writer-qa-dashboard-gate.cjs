const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y481-y490", "y481-y490-dryrun-writer-qa-dashboard-report.json");

function fail(msg) {
  console.error("[Y481-Y490 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing QA dashboard report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};
const q = r.qa || {};

if (r.phase !== "Y481-Y490") fail("Wrong phase");
if (r.status !== "PASS_DRYRUN_QA_READY") fail("Bad status");

for (const k of ["jsonOnly","noRealWriter","noRealKeyboardOutput","noProductionParser","noDeploy"]) {
  if (q[k] !== true) fail("QA failed: " + k);
}

for (const k of ["appJsxModified","fixtureCopy","fixtureModify","productionParser","realWriterImplementation","realKeyboardOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

for (const f of q.fileChecks || []) {
  if (f.jsonOnly !== true) fail("Non-JSON file detected");
  if (f.forbiddenKeyboardExtension !== false) fail("Forbidden extension detected");
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y481-y490", "y481-y490-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y481-Y490",
    status: "PASS",
    confirmed: [
      "DRYRUN_QA_READY",
      "JSON_ONLY",
      "NO_REAL_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y481-Y490 SAFETY PASS]");
