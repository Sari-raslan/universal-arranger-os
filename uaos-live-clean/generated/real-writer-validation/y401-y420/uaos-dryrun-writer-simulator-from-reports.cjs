const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y401-y420");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y401-Y420 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const rules = load("y231-y240/y231-y240-parser-rule-design-report.json");
const validation = load("y261-y270/y261-y270-rule-validation-report.json");
const writerPolicy = load("y391-y400/y391-y400-final-writer-readiness-dashboard-report.json");
const demoGate = load("y351-y360/y351-y360-final-local-demo-gate-report.json");

if (rules.phase !== "Y231-Y240") fail("Bad rules phase");
if (validation.phase !== "Y261-Y270") fail("Bad validation phase");
if (writerPolicy.phase !== "Y391-Y400") fail("Bad writer policy phase");
if (demoGate.phase !== "Y351-Y360") fail("Bad local demo phase");

const dryRunPlans = (validation.validations || []).map((v, index) => ({
  dryRunPlanId: `UAOS_DRYRUN_PLAN_${String(index + 1).padStart(3, "0")}`,
  fileName: v.fileName || `report-only-${index + 1}`,
  validationBand: v.validationBand || "UNKNOWN",
  intendedTarget: "YAMAHA_STYLE_DRY_RUN_ONLY",
  outputKind: "JSON_MANIFEST_ONLY",
  wouldCreateKeyboardFile: false,
  wouldUseRealExtension: false,
  proposedManifestName: `uaos-dryrun-writer-plan-${String(index + 1).padStart(3, "0")}.json`,
  blockedRealExtensions: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
  simulatedSections: [],
  writerImplementation: false,
  realOutput: false,
  deploy: false
}));

const report = {
  phase: "Y401-Y420",
  title: "Dry-run Writer Simulator From Existing Reports",
  status: "PASS_DRYRUN_SIMULATOR_READY",
  dryRunOnly: true,
  existingReportsOnly: true,
  fixtureRead: false,
  outputFolder: "generated/output-sandbox-dryrun",
  realWriterImplemented: false,
  realKeyboardOutputProduced: false,
  dryRunPlans,
  hardLimits: {
    appJsxModified: false,
    fixtureRead: false,
    fixtureCopy: false,
    fixtureModify: false,
    productionParser: false,
    realWriterImplementation: false,
    realStyOutput: false,
    realKeyboardOutput: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y401-y420-dryrun-writer-simulator-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y401-Y420 PASS_DRYRUN_SIMULATOR_READY]");
