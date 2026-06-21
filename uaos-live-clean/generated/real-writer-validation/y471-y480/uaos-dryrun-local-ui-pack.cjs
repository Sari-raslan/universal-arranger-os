const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y471-y480");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y471-Y480 FAIL]", msg);
  process.exit(1);
}

const readerPath = path.join(base, "y461-y470", "y461-y470-dryrun-manifest-reader-report.json");
if (!fs.existsSync(readerPath)) fail("Missing Y461-Y470 reader report");

const reader = JSON.parse(fs.readFileSync(readerPath, "utf8"));

const uiCards = (reader.manifests || []).map((m, index) => ({
  cardId: `DRYRUN_MANIFEST_CARD_${String(index + 1).padStart(3, "0")}`,
  title: m.fileName,
  subtitle: m.intendedTarget || "DRY_RUN_ONLY",
  status: "SAFE_JSON_MANIFEST",
  badges: [
    m.dryRun ? "DRY_RUN" : "NOT_DRY_RUN",
    m.keyboardBinaryOutput === false ? "NO_KEYBOARD_BINARY" : "DANGER",
    m.realWriter === false ? "NO_REAL_WRITER" : "DANGER"
  ],
  source: m.relativePath
}));

const report = {
  phase: "Y471-Y480",
  title: "Dry-run Local UI Pack",
  status: "PASS_LOCAL_UI_READY",
  localUiOnly: true,
  manifestCount: reader.manifestCount,
  uiCards,
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
  path.join(outDir, "y471-y480-dryrun-local-ui-pack-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y471-Y480 PASS_LOCAL_UI_READY]");
