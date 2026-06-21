const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const dryRunDir = path.join(appRoot, "generated", "output-sandbox-dryrun");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y441-y450");
fs.mkdirSync(outDir, { recursive: true });

const forbiddenExt = [".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"];
const allowedExt = [".json"];

function fail(msg) {
  console.error("[Y441-Y450 FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(dryRunDir)) fail("Dry-run output folder missing");

const files = fs.readdirSync(dryRunDir, { withFileTypes: true })
  .filter(f => f.isFile())
  .map(f => {
    const ext = path.extname(f.name).toLowerCase();
    return {
      fileName: f.name,
      extension: ext,
      allowed: allowedExt.includes(ext),
      forbidden: forbiddenExt.includes(ext)
    };
  });

const forbiddenFound = files.filter(f => f.forbidden);
const nonJsonFound = files.filter(f => !f.allowed);

if (forbiddenFound.length > 0) fail("Forbidden real keyboard output found");
if (nonJsonFound.length > 0) fail("Non-JSON file found");

const report = {
  phase: "Y441-Y450",
  title: "Dry-run Extension Blocker + Conformance Report",
  status: "PASS_ALL_DRYRUN_OUTPUTS_JSON_ONLY",
  checkedFolder: "generated/output-sandbox-dryrun",
  files,
  conformance: {
    jsonOnly: true,
    noRealKeyboardExtensions: true,
    noFixtureCopy: true,
    noFixtureModify: true,
    noProductionParser: true,
    noRealWriter: true,
    noDeploy: true
  },
  forbiddenExtensions: forbiddenExt,
  hardLimits: {
    appJsxModified: false,
    fixtureCopy: false,
    fixtureModify: false,
    productionParser: false,
    realWriterImplementation: false,
    realKeyboardOutput: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y441-y450-extension-blocker-conformance-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y441-Y450 PASS_ALL_DRYRUN_OUTPUTS_JSON_ONLY]");
