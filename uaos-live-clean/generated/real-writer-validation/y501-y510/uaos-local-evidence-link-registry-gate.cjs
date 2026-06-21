const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y501-y510", "y501-y510-local-evidence-link-registry-report.json");

function fail(msg) {
  console.error("[Y501-Y510 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing link registry report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y501-Y510") fail("Wrong phase");
if (!String(r.status).startsWith("PASS")) fail("Bad status");
if (r.localIndexOnly !== true) fail("Not local index only");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y501-y510", "y501-y510-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y501-Y510",
    status: "PASS",
    confirmed: [
      "LOCAL_INDEX_ONLY",
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

console.log("[Y501-Y510 SAFETY PASS]");
