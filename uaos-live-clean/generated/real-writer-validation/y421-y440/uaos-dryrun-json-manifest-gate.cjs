const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y421-y440", "y421-y440-dryrun-json-manifest-report.json");
const dryRunDir = path.join(appRoot, "generated", "output-sandbox-dryrun");
const forbiddenExt = new Set([".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"]);

function fail(msg) {
  console.error("[Y421-Y440 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing manifest report");
if (!fs.existsSync(dryRunDir)) fail("Missing dry-run dir");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y421-Y440") fail("Wrong phase");
if (r.status !== "PASS_JSON_MANIFESTS_ONLY") fail("Bad status");
if (r.dryRunOnly !== true) fail("Not dry-run only");

for (const k of ["appJsxModified","fixtureCopy","fixtureModify","productionParser","realWriterImplementation","realStyOutput","realKeyboardOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const files = fs.readdirSync(dryRunDir, { withFileTypes: true }).filter(f => f.isFile()).map(f => f.name);

for (const name of files) {
  const ext = path.extname(name).toLowerCase();
  if (forbiddenExt.has(ext)) fail("Forbidden keyboard output found in dry-run dir: " + name);
  if (ext !== ".json") fail("Non-JSON file found in dry-run dir: " + name);
  const full = path.join(dryRunDir, name);
  const parsed = JSON.parse(fs.readFileSync(full, "utf8"));
  if (parsed.dryRun !== true) fail("Manifest not marked dryRun: " + name);
  if (parsed.keyboardBinaryOutput !== false) fail("Manifest allows keyboard binary output: " + name);
  if (parsed.realWriter !== false) fail("Manifest realWriter not false: " + name);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y421-y440", "y421-y440-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y421-Y440",
    status: "PASS",
    confirmed: [
      "OUTPUT_SANDBOX_DRYRUN_ONLY",
      "JSON_ONLY",
      "NO_REAL_KEYBOARD_EXTENSIONS",
      "NO_REAL_WRITER",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY"
    ],
    checkedFiles: files,
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y421-Y440 SAFETY PASS]");
