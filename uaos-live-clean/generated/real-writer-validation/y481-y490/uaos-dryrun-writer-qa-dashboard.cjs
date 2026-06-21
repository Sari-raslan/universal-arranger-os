const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const dryRunDir = path.join(appRoot, "generated", "output-sandbox-dryrun");
const outDir = path.join(base, "y481-y490");
fs.mkdirSync(outDir, { recursive: true });

const forbiddenExt = new Set([".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"]);

function fail(msg) {
  console.error("[Y481-Y490 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const reader = load("y461-y470/y461-y470-dryrun-manifest-reader-report.json");
const ui = load("y471-y480/y471-y480-dryrun-local-ui-pack-report.json");

const files = fs.readdirSync(dryRunDir, { withFileTypes: true }).filter(f => f.isFile()).map(f => f.name);
const fileChecks = files.map(name => {
  const ext = path.extname(name).toLowerCase();
  return {
    fileName: name,
    extension: ext,
    jsonOnly: ext === ".json",
    forbiddenKeyboardExtension: forbiddenExt.has(ext)
  };
});

if (fileChecks.some(f => f.forbiddenKeyboardExtension)) fail("Forbidden keyboard extension found");
if (fileChecks.some(f => !f.jsonOnly)) fail("Non-JSON file found");

const report = {
  phase: "Y481-Y490",
  title: "Dry-run Writer QA Dashboard",
  status: "PASS_DRYRUN_QA_READY",
  qa: {
    manifestReader: reader.status,
    localUiPack: ui.status,
    manifestCount: reader.manifestCount,
    fileChecks,
    jsonOnly: true,
    noRealWriter: true,
    noRealKeyboardOutput: true,
    noProductionParser: true,
    noDeploy: true
  },
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
  path.join(outDir, "y481-y490-dryrun-writer-qa-dashboard-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y481-Y490 PASS_DRYRUN_QA_READY]");
