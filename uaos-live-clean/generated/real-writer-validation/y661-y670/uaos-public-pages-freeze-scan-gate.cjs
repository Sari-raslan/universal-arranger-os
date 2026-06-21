const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const p = path.join(appRoot, "generated", "real-writer-validation", "y661-y670", "y661-y670-public-pages-freeze-scan-report.json");

function fail(msg) {
  console.error("[Y661-Y670 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing public scan report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y661-Y670") fail("Wrong phase");
if (!String(r.status).startsWith("PASS")) fail("Bad status");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y661-y670", "y661-y670-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y661-Y670",
    status: "PASS",
    confirmed: [
      "PUBLIC_PAGES_SCANNED",
      "NO_APP_JSX",
      "NO_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY"
    ],
    missingCount: r.missingCount,
    weakSafetyTextCount: r.weakSafetyTextCount,
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y661-Y670 SAFETY PASS]");
