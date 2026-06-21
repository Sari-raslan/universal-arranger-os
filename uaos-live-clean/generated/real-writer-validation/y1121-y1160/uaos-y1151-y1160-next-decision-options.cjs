const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1121-y1160");
const docsRoot = path.join(appRoot, "reports", "public-review-docs");
const publicRoot = path.join(appRoot, "public", "governance", "y1121-y1160");
const publicGov = path.join(appRoot, "public", "governance");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(publicGov, { recursive: true });

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  forbiddenKeyboardExtensions: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  outputAllowed: false,
  docsOnly: true,
  commercialProduct: "NO"
};

const options = {
  phase: "Y1151-Y1160",
  title: "Next Decision Options",
  status: "PASS_NEXT_DECISION_OPTIONS_READY",
  safeOptions: [
    { id: "OPT-001", name: "Review UI polish only", risk: "LOW", allowsWriter: false, allowsOutput: false },
    { id: "OPT-002", name: "Documentation refinement only", risk: "LOW", allowsWriter: false, allowsOutput: false },
    { id: "OPT-003", name: "Architecture design only", risk: "LOW", allowsWriter: false, allowsOutput: false },
    { id: "OPT-004", name: "Separate no-output prototype approval", risk: "MEDIUM", allowsWriter: false, allowsOutput: false }
  ],
  unsafeOptionsRequireSeparateApproval: [
    { id: "REQ-001", name: "Writer implementation", requires: "Separate explicit approval and limited scope" },
    { id: "REQ-002", name: "Real keyboard output", requires: "Conformance, hardware validation, legal/product approval" },
    { id: "REQ-003", name: "Production parser", requires: "Production parser approval and test plan" },
    { id: "REQ-004", name: "Deploy/public release", requires: "Release/legal/commercial approval" },
    { id: "REQ-005", name: "Fixtures read/copy/modify", requires: "Separate fixture permission" }
  ],
  finalRecommendation: "Stay in documentation/UI review mode unless a separate explicit approval is given.",
  safety,
  generatedAt: new Date().toISOString()
};

const finalPack = {
  phase: "Y1121-Y1160",
  title: "Public Review UI Polish + Documentation Pack",
  status: "PASS_PUBLIC_REVIEW_UI_DOCS_READY",
  pages: [
    "executive-overview.html",
    "ready-blocked.html",
    "cto-handover-summary.html",
    "next-decision-options.html",
    "public-review-index.html"
  ],
  finalState: {
    executiveOverview: "READY",
    readyBlocked: "READY",
    ctoHandoverSummary: "READY",
    nextDecisionOptions: "READY",
    publicReviewIndex: "READY",
    outputAllowed: "NO",
    writerImplementation: "BLOCKED",
    realWriter: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deployPublicRelease: "BLOCKED",
    fixturesReadCopyModify: "BLOCKED",
    appJsxModified: false,
    commercialProduct: "NO"
  },
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# Next Decision Options

## Safe Options

${options.safeOptions.map(x => `- ${x.id}: ${x.name} — risk ${x.risk}`).join("\n")}

## Unsafe Options Requiring Separate Approval

${options.unsafeOptionsRequireSeparateApproval.map(x => `- ${x.id}: ${x.name} — ${x.requires}`).join("\n")}

## Final Recommendation

${options.finalRecommendation}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function optionRows(items){
  return items.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.name)}</td><td>${esc(x.risk || x.requires)}</td></tr>`).join("\n");
}

const optionsHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Next Decision Options</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Next Decision Options</h1><h2>${esc(options.finalRecommendation)}</h2></div>
<div class="card pass"><h2>Safe Options</h2><table><tr><th>ID</th><th>Name</th><th>Risk</th></tr>${optionRows(options.safeOptions)}</table></div>
<div class="card bad"><h2>Require Separate Approval</h2><table><tr><th>ID</th><th>Name</th><th>Requires</th></tr>${optionRows(options.unsafeOptionsRequireSeparateApproval)}</table></div>
</body>
</html>`;

const indexHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Public Review Index</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Public Review Index</h1><h2 class="pass">Public Review UI + Documentation Pack Ready</h2></div>
<div class="grid">
<div class="card"><h3>Executive Overview</h3><p><a href="./executive-overview.html">Open</a></p></div>
<div class="card"><h3>Ready / Blocked</h3><p><a href="./ready-blocked.html">Open</a></p></div>
<div class="card"><h3>CTO Handover Summary</h3><p><a href="./cto-handover-summary.html">Open</a></p></div>
<div class="card"><h3>Next Decision Options</h3><p><a href="./next-decision-options.html">Open</a></p></div>
<div class="card"><h3>Final Master Index</h3><p><a href="../final-master-index.html">Open</a></p></div>
<div class="card"><h3>Final Handover Freeze</h3><p><a href="../final-handover-freeze.html">Open</a></p></div>
</div>
<div class="card lock"><h2>Final Locks</h2><p>Writer: BLOCKED<br>Real output: BLOCKED<br>Production parser: BLOCKED<br>Deploy: BLOCKED<br>Fixtures touch: BLOCKED<br>App.jsx: false<br>Commercial Product: NO</p></div>
</body>
</html>`;

const govIndex = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>UAOS Governance Index</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style></head>
<body>
<div class="card"><h1>UAOS Governance Index</h1><p>Public review and final governance entry point.</p></div>
<div class="card pass"><h2>Main Pages</h2>
<p><a href="./final-master-index.html">Final Master Index</a></p>
<p><a href="./final-handover-freeze.html">Final Handover Freeze</a></p>
<p><a href="./y1121-y1160/public-review-index.html">Y1121-Y1160 Public Review Index</a></p>
</div>
<div class="card lock"><h2>Blocked Capabilities</h2><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED</p></div>
</body></html>`;

fs.writeFileSync(path.join(docsRoot, "Y1151-next-decision-options.json"), JSON.stringify(options, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1151-next-decision-options.md"), md, "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1160-public-review-pack-final.json"), JSON.stringify(finalPack, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1151-y1160-next-decision-options-report.json"), JSON.stringify({ phase: "Y1151-Y1160", status: "PASS_NEXT_DECISION_OPTIONS_READY", options, finalPack, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1121-y1160-final-public-review-pack-report.json"), JSON.stringify({ phase: "Y1121-Y1160", status: "PASS_PUBLIC_REVIEW_UI_DOCS_READY", finalPack, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "next-decision-options.html"), optionsHtml, "utf8");
fs.writeFileSync(path.join(publicRoot, "public-review-index.html"), indexHtml, "utf8");
fs.writeFileSync(path.join(publicGov, "public-review-index.html"), indexHtml, "utf8");
fs.writeFileSync(path.join(publicGov, "index.html"), govIndex, "utf8");

console.log("[Y1151-Y1160 PASS_NEXT_DECISION_OPTIONS_READY]");
console.log("[Y1121-Y1160 PASS_PUBLIC_REVIEW_UI_DOCS_READY]");
