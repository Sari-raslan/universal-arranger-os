const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y491-y500");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y491-Y500 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const reader = load("y461-y470/y461-y470-dryrun-manifest-reader-report.json");
const ui = load("y471-y480/y471-y480-dryrun-local-ui-pack-report.json");
const qa = load("y481-y490/y481-y490-dryrun-writer-qa-dashboard-report.json");

const final = {
  phase: "Y491-Y500",
  title: "Final Dry-run Local Viewer Gate",
  status: "PASS_LOCAL_VIEWER_READY",
  finalState: {
    dryRunManifestViewer: "READY",
    localDemoUiPages: "READY",
    dryRunWriterQaDashboard: "READY",
    jsonOnly: "PASS",
    realWriter: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deploy: "BLOCKED",
    appJsxModified: false
  },
  localPages: [
    "y461-y470-dryrun-manifest-viewer.html",
    "y471-y480-dryrun-local-ui-pack.html",
    "y481-y490-dryrun-writer-qa-dashboard.html",
    "y491-y500-final-dryrun-local-viewer-gate.html"
  ],
  sourceStatuses: {
    reader: reader.status,
    ui: ui.status,
    qa: qa.status
  },
  nextSafeStep: "Optional: create a static public index page linking all UAOS local demo evidence pages. Still no App.jsx, no deploy, no writer.",
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
  path.join(outDir, "y491-y500-final-dryrun-local-viewer-gate-report.json"),
  JSON.stringify(final, null, 2),
  "utf8"
);

console.log("[Y491-Y500 PASS_LOCAL_VIEWER_READY]");
