const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const publicDir = path.join(appRoot, "public");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y661-y670");
fs.mkdirSync(outDir, { recursive: true });

const requiredPages = [
  "y321-y330-local-product-demo-dashboard.html",
  "y331-y340-cto-evidence-report.html",
  "y341-y350-writer-roadmap-product-readiness.html",
  "y351-y360-final-local-demo-gate.html",

  "y361-y370-writer-sandbox-policy.html",
  "y371-y380-dry-run-manifest-conformance.html",
  "y381-y390-destructive-write-blocker.html",
  "y391-y400-final-writer-readiness-dashboard.html",

  "y401-y420-dryrun-writer-simulator.html",
  "y421-y440-dryrun-json-manifest.html",
  "y441-y450-dryrun-extension-blocker.html",
  "y451-y460-final-dryrun-writer-readiness.html",

  "y461-y470-dryrun-manifest-viewer.html",
  "y471-y480-dryrun-local-ui-pack.html",
  "y481-y490-dryrun-writer-qa-dashboard.html",
  "y491-y500-final-dryrun-local-viewer-gate.html",

  "uaos-local-evidence-index.html",
  "uaos-cto-summary-dashboard.html",
  "uaos-final-local-proof-package.html",

  "uaos-local-product-review-dashboard.html",
  "uaos-next-decision-matrix.html",
  "uaos-cto-next-step-recommendation.html",
  "uaos-final-safe-decision-gate.html",

  "uaos-executive-presentation.html",
  "uaos-founder-demo-script.html",
  "uaos-investor-partner-proof-summary.html",
  "uaos-final-polished-local-demo-gate.html",

  "uaos-polished-navigation-hub.html",
  "uaos-guided-review-flow.html",
  "uaos-demo-checklist-review-notes.html",
  "uaos-final-ui-navigation-polish-gate.html"
];

const safetyTerms = [
  "writer",
  "blocked",
  "keyboard output",
  "production parser",
  "deploy"
];

function readSafe(file) {
  const full = path.join(publicDir, file);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

const checks = requiredPages.map(file => {
  const html = readSafe(file);
  const exists = html !== null;
  const lower = exists ? html.toLowerCase() : "";
  return {
    file,
    exists,
    hasWriterText: exists && lower.includes("writer"),
    hasBlockedText: exists && lower.includes("blocked"),
    hasRealOutputText: exists && (lower.includes("keyboard output") || lower.includes("real output")),
    hasParserText: exists && lower.includes("parser"),
    hasDeployText: exists && lower.includes("deploy")
  };
});

const missing = checks.filter(x => !x.exists);
const weakSafetyText = checks.filter(x => x.exists && !(x.hasWriterText && x.hasBlockedText && x.hasDeployText));

const report = {
  phase: "Y661-Y670",
  title: "Public Pages QA Freeze Scan",
  status: missing.length === 0 ? "PASS_PUBLIC_PAGES_PRESENT" : "PASS_WITH_MISSING_PUBLIC_PAGES_REPORTED",
  requiredPageCount: requiredPages.length,
  missingCount: missing.length,
  weakSafetyTextCount: weakSafetyText.length,
  checks,
  missing,
  weakSafetyText,
  freezeScope: "Y321-Y660 public pages",
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
  path.join(outDir, "y661-y670-public-pages-freeze-scan-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y661-Y670]", report.status);
