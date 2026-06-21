const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y591-y600");
fs.mkdirSync(outDir, { recursive: true });

const demoScript = [
  {
    step: 1,
    title: "Open the Local Evidence Index",
    talkingPoint: "This page collects the proof of the Yamaha parser validation and dry-run writer safety work.",
    link: "uaos-local-evidence-index.html"
  },
  {
    step: 2,
    title: "Show the CTO Summary",
    talkingPoint: "The CTO summary explains what is ready locally and what is intentionally blocked.",
    link: "uaos-cto-summary-dashboard.html"
  },
  {
    step: 3,
    title: "Show Dry-run Manifest Viewer",
    talkingPoint: "The system simulates writer output safely as JSON-only manifests, not keyboard files.",
    link: "y461-y470-dryrun-manifest-viewer.html"
  },
  {
    step: 4,
    title: "Show Final Decision Gate",
    talkingPoint: "The next safe decision is UI polish and dry-run improvement, not real writer or deploy.",
    link: "uaos-final-safe-decision-gate.html"
  },
  {
    step: 5,
    title: "Close with the Safety Position",
    talkingPoint: "UAOS is a local proof-of-technology package. Real writer, production parser, real keyboard output, and deploy are blocked.",
    link: "uaos-final-local-proof-package.html"
  }
];

const report = {
  phase: "Y591-Y600",
  title: "Founder Demo Script Page",
  status: "PASS_FOUNDER_DEMO_SCRIPT_READY",
  demoScript,
  founderMessage: "Show value clearly, then show safety clearly.",
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

const stepsHtml = demoScript.map(s => `
  <div class="card">
    <h2>${s.step}. ${s.title}</h2>
    <p>${s.talkingPoint}</p>
    <p><a href="./${s.link}">Open page</a></p>
  </div>
`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Founder Demo Script</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:28px;border-radius:18px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:14px;padding:18px;margin:14px 0}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Founder Demo Script</h1>
    <p>Use this as the speaking flow for a local demo.</p>
  </div>

  ${stepsHtml}

  <div class="card lock">
    <h2>Safety Line</h2>
    <p>Real writer, real keyboard output, production parser, and deploy are intentionally blocked.</p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-founder-demo-script.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y591-y600-founder-demo-script-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y591-Y600 PASS_FOUNDER_DEMO_SCRIPT_READY]");
