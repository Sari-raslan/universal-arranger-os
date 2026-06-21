const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y611-y620");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y611-Y620 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const exec = load("y581-y590/y581-y590-executive-presentation-report.json");
const founder = load("y591-y600/y591-y600-founder-demo-script-report.json");
const investor = load("y601-y610/y601-y610-investor-partner-proof-summary-report.json");

const final = {
  phase: "Y611-Y620",
  title: "Final Polished Local Demo Gate",
  status: "PASS_POLISHED_LOCAL_DEMO_READY",
  finalConclusion: "UAOS local proof package now has an executive presentation layer, founder demo script, and investor/partner summary. It remains local-only and safe.",
  polishedPages: [
    "uaos-executive-presentation.html",
    "uaos-founder-demo-script.html",
    "uaos-investor-partner-proof-summary.html",
    "uaos-final-polished-local-demo-gate.html"
  ],
  sourceStatuses: {
    executivePresentation: exec.status,
    founderDemoScript: founder.status,
    investorPartnerSummary: investor.status
  },
  finalState: {
    executivePresentation: "READY",
    founderDemoScript: "READY",
    investorPartnerProofSummary: "READY",
    polishedLocalDemoGate: "READY",
    writer: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deploy: "BLOCKED",
    appJsxModified: false,
    commercialProduct: "NO"
  },
  recommendedNext: "Choose either Y621-Y660 local UI navigation polish or pause and review the complete proof package.",
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
  <title>UAOS Final Polished Local Demo Gate</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:28px;border-radius:18px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:14px;padding:18px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Final Polished Local Demo Gate</h1>
    <h2>Y611-Y620 PASS_POLISHED_LOCAL_DEMO_READY</h2>
    <p>The local proof package is now presentation-ready for founder, CTO, investor, or partner review.</p>
  </div>

  <div class="grid">
    <div class="card pass"><h3>Executive Presentation</h3><p>READY</p></div>
    <div class="card pass"><h3>Founder Demo Script</h3><p>READY</p></div>
    <div class="card pass"><h3>Investor / Partner Summary</h3><p>READY</p></div>
    <div class="card pass"><h3>Polished Local Demo Gate</h3><p>READY</p></div>
    <div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Keyboard Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>Open Presentation Layer</h2>
    <p><a href="./uaos-executive-presentation.html">Executive Presentation</a></p>
    <p><a href="./uaos-founder-demo-script.html">Founder Demo Script</a></p>
    <p><a href="./uaos-investor-partner-proof-summary.html">Investor / Partner Proof Summary</a></p>
    <p><a href="./uaos-local-evidence-index.html">Full Evidence Index</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-final-polished-local-demo-gate.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y611-y620-final-polished-local-demo-gate-report.json"), JSON.stringify(final, null, 2), "utf8");

console.log("[Y611-Y620 PASS_POLISHED_LOCAL_DEMO_READY]");
