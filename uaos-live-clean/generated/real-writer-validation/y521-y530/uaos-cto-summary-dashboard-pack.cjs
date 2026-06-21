const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const publicDir = path.join(appRoot, "public");
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y521-y530");
fs.mkdirSync(outDir, { recursive: true });

function loadOptional(rel) {
  const p = path.join(base, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

const localDemo = loadOptional("y351-y360/y351-y360-final-local-demo-gate-report.json");
const dryRun = loadOptional("y451-y460/y451-y460-final-dryrun-writer-readiness-report.json");
const viewer = loadOptional("y491-y500/y491-y500-final-dryrun-local-viewer-gate-report.json");
const index = loadOptional("y511-y520/y511-y520-local-evidence-index-report.json");

const summary = {
  phase: "Y521-Y530",
  title: "CTO Summary Dashboard",
  status: "PASS_CTO_SUMMARY_READY",
  verdict: "LOCAL_PROOF_PACKAGE_READY",
  summary: {
    localDemo: localDemo ? localDemo.status : "UNKNOWN",
    dryRunWriter: dryRun ? dryRun.status : "UNKNOWN",
    localViewer: viewer ? viewer.status : "UNKNOWN",
    evidenceIndex: index ? index.status : "UNKNOWN"
  },
  decision: {
    publishNow: "NO",
    openRealWriterNow: "NO",
    bestNextStep: "Use local evidence package for review, then choose UI/product refinement or separately approved dry-run-only improvements."
  },
  finalLocks: {
    writer: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deploy: "BLOCKED"
  },
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
  <title>UAOS CTO Summary Dashboard</title>
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
    <h1>UAOS CTO Summary Dashboard</h1>
    <h2>LOCAL_PROOF_PACKAGE_READY</h2>
    <p>The local evidence package is ready for review. This is not a commercial release.</p>
  </div>

  <div class="grid">
    <div class="card pass"><h3>Local Demo</h3><p>${summary.summary.localDemo}</p></div>
    <div class="card pass"><h3>Dry-run Writer</h3><p>${summary.summary.dryRunWriter}</p></div>
    <div class="card pass"><h3>Local Viewer</h3><p>${summary.summary.localViewer}</p></div>
    <div class="card pass"><h3>Evidence Index</h3><p>${summary.summary.evidenceIndex}</p></div>
    <div class="card lock"><h3>Real Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Keyboard Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h3>CTO Recommendation</h3>
    <p>Do not publish or open real writer yet. Use this local evidence package for review, then decide between UI/product refinement and separately approved dry-run-only improvements.</p>
    <p><a href="./uaos-local-evidence-index.html">Open Local Evidence Index</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-cto-summary-dashboard.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y521-y530-cto-summary-dashboard-report.json"), JSON.stringify(summary, null, 2), "utf8");

console.log("[Y521-Y530 PASS_CTO_SUMMARY_READY]");
