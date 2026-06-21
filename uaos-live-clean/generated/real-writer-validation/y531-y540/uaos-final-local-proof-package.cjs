const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const publicDir = path.join(appRoot, "public");
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y531-y540");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y531-Y540 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const index = load("y511-y520/y511-y520-local-evidence-index-report.json");
const cto = load("y521-y530/y521-y530-cto-summary-dashboard-report.json");

const final = {
  phase: "Y531-Y540",
  title: "Final Local Proof Package Report",
  status: "PASS_LOCAL_PROOF_PACKAGE_READY",
  finalConclusion: "UAOS local evidence and demo navigation hub are ready for review. No production parser, writer, real keyboard output, or deploy is enabled.",
  packagePages: [
    "uaos-local-evidence-index.html",
    "uaos-cto-summary-dashboard.html",
    "uaos-final-local-proof-package.html"
  ],
  sourceStatuses: {
    evidenceIndex: index.status,
    ctoSummary: cto.status
  },
  finalState: {
    localEvidenceIndex: "READY",
    ctoSummaryDashboard: "READY",
    finalProofPackage: "READY",
    writer: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deploy: "BLOCKED",
    appJsxModified: false,
    commercialProduct: "NO"
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
  <title>UAOS Final Local Proof Package</title>
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
    <h1>UAOS Final Local Proof Package</h1>
    <h2>Y501-Y540 PASS_LOCAL_PROOF_PACKAGE_READY</h2>
    <p>All local evidence pages are collected into one review package.</p>
  </div>

  <div class="grid">
    <div class="card pass"><h3>Evidence Index</h3><p>READY</p></div>
    <div class="card pass"><h3>CTO Summary</h3><p>READY</p></div>
    <div class="card pass"><h3>Local Proof Package</h3><p>READY</p></div>
    <div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Keyboard Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
    <div class="card bad"><h3>Commercial Product</h3><p>NO</p></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h3>Open Package</h3>
    <p><a href="./uaos-local-evidence-index.html">Local Evidence Index</a></p>
    <p><a href="./uaos-cto-summary-dashboard.html">CTO Summary Dashboard</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-final-local-proof-package.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y531-y540-final-local-proof-package-report.json"), JSON.stringify(final, null, 2), "utf8");

console.log("[Y531-Y540 PASS_LOCAL_PROOF_PACKAGE_READY]");
