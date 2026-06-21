const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y461-y470", "y461-y470-dryrun-manifest-reader-report.json");

function fail(msg) {
  console.error("[Y461-Y470 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing reader report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y461-Y470") fail("Wrong phase");
if (r.status !== "PASS_JSON_MANIFESTS_READ") fail("Bad status");

for (const k of ["appJsxModified","fixtureCopy","fixtureModify","productionParser","realWriterImplementation","realKeyboardOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

for (const m of r.manifests || []) {
  if (!m.fileName.endsWith(".json")) fail("Manifest not JSON");
  if (m.dryRun !== true) fail("Manifest dryRun not true");
  if (m.keyboardBinaryOutput !== false) fail("Keyboard output not false");
  if (m.realWriter !== false) fail("Real writer not false");
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y461-y470", "y461-y470-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y461-Y470",
    status: "PASS",
    confirmed: [
      "READ_JSON_MANIFESTS_ONLY",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_REAL_WRITER",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y461-Y470 SAFETY PASS]");
