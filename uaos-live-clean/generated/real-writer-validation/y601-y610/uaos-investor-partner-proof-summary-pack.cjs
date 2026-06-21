const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y601-y610");
fs.mkdirSync(outDir, { recursive: true });

const proofSummary = {
  problem: "Arranger keyboard workflows are complex, fragmented, and time-consuming for musicians and content creators.",
  opportunity: "UAOS aims to create a safer, guided workflow layer for parsing, planning, validating, and eventually generating arranger assets.",
  proofToday: [
    "Local evidence index exists.",
    "CTO summary dashboard exists.",
    "Dry-run writer manifests exist as JSON-only evidence.",
    "Decision gates exist and block unsafe steps.",
    "Founder demo script exists."
  ],
  notReadyYet: [
    "No real writer.",
    "No real keyboard output.",
    "No production parser.",
    "No deploy.",
    "No commercial release."
  ],
  askForPartner: "Review the local proof package and advise on product direction, keyboard format validation, and future conformance testing."
};

const report = {
  phase: "Y601-Y610",
  title: "Investor / Partner Proof Summary",
  status: "PASS_INVESTOR_PARTNER_SUMMARY_READY",
  proofSummary,
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

const proofHtml = proofSummary.proofToday.map(x => `<li>${x}</li>`).join("\n");
const notReadyHtml = proofSummary.notReadyYet.map(x => `<li>${x}</li>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Investor / Partner Proof Summary</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:28px;border-radius:18px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:14px;padding:18px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Investor / Partner Proof Summary</h1>
    <p>Local proof package for discussion, not a production launch.</p>
  </div>

  <div class="grid">
    <div class="card"><h2>Problem</h2><p>${proofSummary.problem}</p></div>
    <div class="card"><h2>Opportunity</h2><p>${proofSummary.opportunity}</p></div>
  </div>

  <div class="card pass">
    <h2>Proof Today</h2>
    <ul>${proofHtml}</ul>
  </div>

  <div class="card lock">
    <h2>Not Ready Yet</h2>
    <ul>${notReadyHtml}</ul>
  </div>

  <div class="card">
    <h2>Partner Ask</h2>
    <p>${proofSummary.askForPartner}</p>
    <p><a href="./uaos-local-evidence-index.html">Open Local Evidence Index</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-investor-partner-proof-summary.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y601-y610-investor-partner-proof-summary-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y601-Y610 PASS_INVESTOR_PARTNER_SUMMARY_READY]");
