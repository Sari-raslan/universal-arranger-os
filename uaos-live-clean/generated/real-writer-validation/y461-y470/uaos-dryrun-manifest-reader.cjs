const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const dryRunDir = path.join(appRoot, "generated", "output-sandbox-dryrun");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y461-y470");
fs.mkdirSync(outDir, { recursive: true });

const forbiddenExt = new Set([".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"]);

function fail(msg) {
  console.error("[Y461-Y470 FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(dryRunDir)) fail("Missing generated/output-sandbox-dryrun");

const files = fs.readdirSync(dryRunDir, { withFileTypes: true })
  .filter(f => f.isFile())
  .map(f => f.name);

const manifests = [];

for (const fileName of files) {
  const ext = path.extname(fileName).toLowerCase();

  if (forbiddenExt.has(ext)) {
    fail("Forbidden keyboard extension found in dry-run folder: " + fileName);
  }

  if (ext !== ".json") {
    fail("Non-JSON file found in dry-run folder: " + fileName);
  }

  const full = path.join(dryRunDir, fileName);
  const parsed = JSON.parse(fs.readFileSync(full, "utf8"));

  if (parsed.dryRun !== true) fail("Manifest is not dryRun=true: " + fileName);
  if (parsed.keyboardBinaryOutput !== false) fail("Manifest allows keyboardBinaryOutput: " + fileName);
  if (parsed.realWriter !== false) fail("Manifest allows realWriter: " + fileName);

  manifests.push({
    fileName,
    relativePath: path.join("generated", "output-sandbox-dryrun", fileName).replace(/\\/g, "/"),
    manifestType: parsed.manifestType || "UNKNOWN",
    version: parsed.version || "UNKNOWN",
    sourcePlanId: parsed.sourcePlanId || null,
    intendedTarget: parsed.intendedTarget || null,
    outputKind: parsed.outputKind || "JSON_MANIFEST_ONLY",
    dryRun: parsed.dryRun,
    keyboardBinaryOutput: parsed.keyboardBinaryOutput,
    realWriter: parsed.realWriter,
    productionParser: parsed.productionParser,
    generatedAt: parsed.generatedAt || null
  });
}

const report = {
  phase: "Y461-Y470",
  title: "Dry-run Manifest Reader",
  status: "PASS_JSON_MANIFESTS_READ",
  dryRunFolder: "generated/output-sandbox-dryrun",
  manifestCount: manifests.length,
  manifests,
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
  path.join(outDir, "y461-y470-dryrun-manifest-reader-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y461-Y470 PASS_JSON_MANIFESTS_READ]");
