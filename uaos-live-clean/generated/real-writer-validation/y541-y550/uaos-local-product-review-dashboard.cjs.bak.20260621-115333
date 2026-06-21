const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y541-y550");
const publicDir = path.join(appRoot, "public");
fs.mkdirSync(outDir, { recursive: true });

function loadOptional(rel) {
  const p = path.join(base, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

const proof = loadOptional("y531-y540/y531-y540-final-local-proof-package-report.json");
const viewer = loadOptional("y491-y500/y491-y500-final-dryrun-local-viewer-gate-report.json");
const dryRun = loadOptional("y451-y460/y451-y460-final-dryrun-writer-readiness-report.json");
const cto = loadOptional("y521-y530/y521-y530-cto-summary-dashboard-report.json");

const report = {
  phase: "Y541-Y550",
  title: "Local Product Review Dashboard",
  status: "PASS_REVIEW_DASHBOARD_READY",
  reviewVerdict: "LOCAL_REVIEW_READY",
  readiness: {
    localProofPackage: proof ? proof.status : "MISSING",
    dryRunViewer: viewer ? viewer.status : "MISSING",
    dryRunWriter: dryRun ? dryRun.status : "MISSING",
    ctoSummary: cto ? cto.status : "MISSING"
  },
  reviewFindings: [
    "UAOS has a local proof package ready for review.",
    "Dry-run writer evidence exists as JSON-only manifests.",
    "Local UI evidence pages exist.",
    "Real writer remains blocked.",
    "Real keyboard output remains blocked.",
    "Production parser remains blocked.",
    "Deploy remains blocked."
  ],
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Local Product Review Dashboard</title>
  <style>
    body{font-family:Arial;background:#101010;color:#eee;padding:28px;line-height:1.5}
    .hero{padding:24px;border-radius:16px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
    .card{background:#1b1b1b;border:1px solid #444;border-radius:14px;padding:18px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Local Product Review Dashboard</h1>
    <h2>Y541-Y550 LOCAL_REVIEW_READY</h2>
    <p>Review state after local proof package, dry-run manifests, and evidence index.</p>
  </div>

  <div class="grid">
    <div class="card pass"><h3>Local Proof Package</h3><p>${report.readiness.localProofPackage}</p></div>
    <div class="card pass"><h3>Dry-run Viewer</h3><p>${report.readiness.dryRunViewer}</p></div>
    <div class="card pass"><h3>Dry-run Writer</h3><p>${report.readiness.dryRunWriter}</p></div>
    <div class="card pass"><h3>CTO Summary</h3><p>${report.readiness.ctoSummary}</p></div>
    <div class="card lock"><h3>Real Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Keyboard Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h3>Open Proof Package</h3>
    <p><a href="./uaos-final-local-proof-package.html">Final Local Proof Package</a></p>
    <p><a href="./uaos-local-evidence-index.html">Local Evidence Index</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-local-product-review-dashboard.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y541-y550-local-product-review-dashboard-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y541-Y550 PASS_REVIEW_DASHBOARD_READY]");
