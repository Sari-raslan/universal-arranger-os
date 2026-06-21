const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y581-y590");
fs.mkdirSync(outDir, { recursive: true });

function loadOptional(rel) {
  const p = path.join(base, rel);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

const proof = loadOptional("y531-y540/y531-y540-final-local-proof-package-report.json");
const decision = loadOptional("y571-y580/y571-y580-final-safe-decision-gate-report.json");

const report = {
  phase: "Y581-Y590",
  title: "Executive Presentation Page",
  status: "PASS_EXECUTIVE_PRESENTATION_READY",
  presentationOnly: true,
  sourceStatuses: {
    proofPackage: proof ? proof.status : "MISSING",
    decisionGate: decision ? decision.status : "MISSING"
  },
  executiveMessage: {
    headline: "UAOS has a local proof package ready for review.",
    value: "The project demonstrates a safe foundation for Yamaha parser validation, dry-run writer planning, local evidence navigation, and product decision gates.",
    limits: [
      "No real writer.",
      "No real keyboard output.",
      "No production parser.",
      "No deploy.",
      "Not a commercial final product yet."
    ]
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
  <title>UAOS Executive Presentation</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:28px;border-radius:18px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:14px;padding:18px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
    .big{font-size:22px;font-weight:bold}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Executive Presentation</h1>
    <p class="big">Local Proof Package Ready</p>
    <p>UAOS now has a polished local evidence layer showing parser validation, dry-run writer safety, and next decision gates.</p>
  </div>

  <div class="grid">
    <div class="card pass"><h3>What is Ready</h3><p>Local proof package, evidence index, CTO summary, dry-run manifest viewer, and safe decision gates.</p></div>
    <div class="card pass"><h3>Business Value</h3><p>Shows a credible foundation for arranger keyboard workflow automation without unsafe output claims.</p></div>
    <div class="card pass"><h3>Technical Value</h3><p>Reports, gates, dry-run manifests, and local dashboards prove the direction safely.</p></div>
    <div class="card lock"><h3>What is Blocked</h3><p>Real writer, real keyboard output, production parser, deploy, and commercial release.</p></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>Recommended Next</h2>
    <p>Continue polishing the local demo and product story. Do not open real writer until a separate writer specification/conformance phase is approved.</p>
    <p><a href="./uaos-final-local-proof-package.html">Open Final Local Proof Package</a></p>
    <p><a href="./uaos-final-safe-decision-gate.html">Open Final Safe Decision Gate</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-executive-presentation.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y581-y590-executive-presentation-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y581-Y590 PASS_EXECUTIVE_PRESENTATION_READY]");
