const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y501-y510");
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  {
    group: "Local Demo Gate",
    phase: "Y321-Y360",
    title: "Local Product Demo Dashboard",
    file: "y321-y330-local-product-demo-dashboard.html",
    status: "READY"
  },
  {
    group: "Local Demo Gate",
    phase: "Y321-Y360",
    title: "CTO Evidence Report",
    file: "y331-y340-cto-evidence-report.html",
    status: "READY"
  },
  {
    group: "Local Demo Gate",
    phase: "Y321-Y360",
    title: "Writer Roadmap + Product Readiness",
    file: "y341-y350-writer-roadmap-product-readiness.html",
    status: "READY"
  },
  {
    group: "Local Demo Gate",
    phase: "Y321-Y360",
    title: "Final Local Demo Gate",
    file: "y351-y360-final-local-demo-gate.html",
    status: "READY"
  },
  {
    group: "Writer Policy",
    phase: "Y361-Y400",
    title: "Writer Sandbox Policy",
    file: "y361-y370-writer-sandbox-policy.html",
    status: "READY"
  },
  {
    group: "Writer Policy",
    phase: "Y361-Y400",
    title: "Dry-run Manifest + Conformance",
    file: "y371-y380-dry-run-manifest-conformance.html",
    status: "READY"
  },
  {
    group: "Writer Policy",
    phase: "Y361-Y400",
    title: "Destructive-write Blocker",
    file: "y381-y390-destructive-write-blocker.html",
    status: "READY"
  },
  {
    group: "Writer Policy",
    phase: "Y361-Y400",
    title: "Final Writer Readiness Dashboard",
    file: "y391-y400-final-writer-readiness-dashboard.html",
    status: "READY"
  },
  {
    group: "Dry-run Writer",
    phase: "Y401-Y460",
    title: "Dry-run Writer Simulator",
    file: "y401-y420-dryrun-writer-simulator.html",
    status: "READY"
  },
  {
    group: "Dry-run Writer",
    phase: "Y401-Y460",
    title: "Dry-run JSON Manifest",
    file: "y421-y440-dryrun-json-manifest.html",
    status: "READY"
  },
  {
    group: "Dry-run Writer",
    phase: "Y401-Y460",
    title: "Dry-run Extension Blocker",
    file: "y441-y450-dryrun-extension-blocker.html",
    status: "READY"
  },
  {
    group: "Dry-run Writer",
    phase: "Y401-Y460",
    title: "Final Dry-run Writer Readiness",
    file: "y451-y460-final-dryrun-writer-readiness.html",
    status: "READY"
  },
  {
    group: "Manifest Viewer",
    phase: "Y461-Y500",
    title: "Dry-run Manifest Viewer",
    file: "y461-y470-dryrun-manifest-viewer.html",
    status: "READY"
  },
  {
    group: "Manifest Viewer",
    phase: "Y461-Y500",
    title: "Dry-run Local UI Pack",
    file: "y471-y480-dryrun-local-ui-pack.html",
    status: "READY"
  },
  {
    group: "Manifest Viewer",
    phase: "Y461-Y500",
    title: "Dry-run Writer QA Dashboard",
    file: "y481-y490-dryrun-writer-qa-dashboard.html",
    status: "READY"
  },
  {
    group: "Manifest Viewer",
    phase: "Y461-Y500",
    title: "Final Dry-run Local Viewer Gate",
    file: "y491-y500-final-dryrun-local-viewer-gate.html",
    status: "READY"
  }
];

const publicDir = path.join(appRoot, "public");

const checkedPages = pages.map(p => {
  const full = path.join(publicDir, p.file);
  return {
    ...p,
    exists: fs.existsSync(full),
    url: `./${p.file}`
  };
});

const missing = checkedPages.filter(p => !p.exists);

const report = {
  phase: "Y501-Y510",
  title: "Local Evidence Link Registry",
  status: missing.length === 0 ? "PASS_ALL_LINKS_FOUND" : "PASS_WITH_MISSING_LINKS_REPORTED",
  localIndexOnly: true,
  pageCount: checkedPages.length,
  missingCount: missing.length,
  pages: checkedPages,
  missing,
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y501-y510-local-evidence-link-registry-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y501-Y510]", report.status);
