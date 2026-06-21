const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const p = path.join(appRoot, "generated", "real-writer-validation", "y671-y680", "y671-y680-generated-reports-freeze-scan-report.json");

function fail(msg) {
  console.error("[Y671-Y680 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing generated reports scan");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y671-Y680") fail("Wrong phase");
if (!String(r.status).startsWith("PASS")) fail("Bad status");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y671-y680", "y671-y680-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y671-Y680",
    status: "PASS",
    confirmed: [
      "GENERATED_REPORTS_SCANNED",
      "NO_APP_JSX",
      "NO_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY"
    ],
    missingCount: r.missingCount,
    parseErrorCount: r.parseErrorCount,
    weakLocksCount: r.weakLocksCount,
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y671-Y680 SAFETY PASS]");
