const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const dryRunDir = path.join(appRoot, "generated", "output-sandbox-dryrun");
const outDir = path.join(base, "y421-y440");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(dryRunDir, { recursive: true });

function fail(msg) {
  console.error("[Y421-Y440 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const sim = load("y401-y420/y401-y420-dryrun-writer-simulator-report.json");

if (sim.phase !== "Y401-Y420") fail("Bad simulator phase");
if (sim.dryRunOnly !== true) fail("Simulator not dry-run only");

const forbiddenExt = [".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"];
const generatedManifests = [];

for (const [index, plan] of (sim.dryRunPlans || []).entries()) {
  const safeName = plan.proposedManifestName || `uaos-dryrun-writer-plan-${String(index + 1).padStart(3, "0")}.json`;
  const ext = path.extname(safeName).toLowerCase();

  if (ext !== ".json") fail("Dry-run manifest must be .json: " + safeName);
  if (forbiddenExt.includes(ext)) fail("Forbidden extension used: " + safeName);

  const manifest = {
    manifestType: "UAOS_DRY_RUN_WRITER_MANIFEST",
    version: "1.0.0-dryrun",
    dryRun: true,
    keyboardBinaryOutput: false,
    realWriter: false,
    productionParser: false,
    sourcePhase: "Y401-Y420",
    sourcePlanId: plan.dryRunPlanId,
    intendedTarget: plan.intendedTarget,
    outputKind: "JSON_MANIFEST_ONLY",
    blockedRealExtensions: plan.blockedRealExtensions,
    plannedFileName: safeName,
    generatedAt: new Date().toISOString()
  };

  const manifestPath = path.join(dryRunDir, safeName);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  generatedManifests.push({
    fileName: safeName,
    relativePath: path.join("generated", "output-sandbox-dryrun", safeName).replace(/\\/g, "/"),
    extension: ext,
    jsonOnly: true,
    keyboardBinaryOutput: false
  });
}

const report = {
  phase: "Y421-Y440",
  title: "Dry-run JSON Manifest Generator",
  status: "PASS_JSON_MANIFESTS_ONLY",
  dryRunOnly: true,
  outputFolder: "generated/output-sandbox-dryrun",
  generatedManifests,
  hardLimits: {
    appJsxModified: false,
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
  path.join(outDir, "y421-y440-dryrun-json-manifest-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y421-Y440 PASS_JSON_MANIFESTS_ONLY]");
