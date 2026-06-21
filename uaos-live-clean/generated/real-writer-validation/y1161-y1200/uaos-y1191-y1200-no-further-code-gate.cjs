const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1161-y1200");
const docsRoot = path.join(appRoot, "reports", "repository-presentation");
const publicRoot = path.join(appRoot, "public", "governance", "y1161-y1200");
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
  commercialProduct: "NO",
  noFurtherCodeWithoutApproval: true
};

const gate = {
  phase: "Y1191-Y1200",
  title: "No Further Code Without Approval Gate",
  status: "PASS_NO_FURTHER_CODE_WITHOUT_APPROVAL_GATE_READY",
  gateState: "ACTIVE",
  finalRule: "NO_FURTHER_CODE_WITHOUT_EXPLICIT_APPROVAL",
  reason: "All safe docs/UI/governance/sandbox review work is complete under the current constraints.",
  allowedNextWithoutApproval: [
    "Open and review local HTML pages",
    "Read generated reports",
    "Discuss decisions",
    "Prepare approval text"
  ],
  notAllowedWithoutApproval: [
    "writer implementation",
    "real writer",
    "real keyboard output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify",
    "App.jsx modification",
    "commercial release claims"
  ],
  finalState: {
    repositoryPresentation: "READY",
    reviewNavigation: "READY",
    presentationAudit: "CLEAN",
    noFurtherCodeGate: "ACTIVE",
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

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}
const stateRows = Object.entries(gate.finalState).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS No Further Code Gate</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS No Further Code Without Approval Gate</h1><h2 class="bad">${esc(gate.finalRule)}</h2><p>${esc(gate.reason)}</p></div>
<div class="card pass"><h2>Allowed Next Without Approval</h2><ul>${list(gate.allowedNextWithoutApproval)}</ul></div>
<div class="card bad"><h2>Not Allowed Without Approval</h2><ul>${list(gate.notAllowedWithoutApproval)}</ul></div>
<div class="card"><h2>Final State</h2><table><tr><th>Item</th><th>Status</th></tr>${stateRows}</table></div>
</body>
</html>`;

const finalIndex = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Final Review Hub</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Final Review Hub</h1><h2 class="pass">Repository Presentation Complete</h2></div>
<div class="grid">
<div class="card"><h3>Final Master Index</h3><p><a href="../final-master-index.html">Open</a></p></div>
<div class="card"><h3>Public Review Index</h3><p><a href="../y1121-y1160/public-review-index.html">Open</a></p></div>
<div class="card"><h3>Repository README</h3><p><a href="./repository-readme.html">Open</a></p></div>
<div class="card"><h3>Review Navigation</h3><p><a href="./review-navigation-index.html">Open</a></p></div>
<div class="card"><h3>Presentation Audit</h3><p><a href="./presentation-audit.html">Open</a></p></div>
<div class="card"><h3>No Further Code Gate</h3><p><a href="./no-further-code-gate.html">Open</a></p></div>
</div>
<div class="card lock"><h2>Final Rule</h2><p>NO FURTHER CODE WITHOUT EXPLICIT APPROVAL</p></div>
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
<div class="card"><h1>UAOS Governance Index</h1><p>Final review hub.</p></div>
<div class="card pass"><h2>Main Pages</h2>
<p><a href="./final-master-index.html">Final Master Index</a></p>
<p><a href="./final-handover-freeze.html">Final Handover Freeze</a></p>
<p><a href="./y1121-y1160/public-review-index.html">Y1121-Y1160 Public Review Index</a></p>
<p><a href="./y1161-y1200/final-review-hub.html">Y1161-Y1200 Final Review Hub</a></p>
<p><a href="./y1161-y1200/no-further-code-gate.html">No Further Code Gate</a></p>
</div>
<div class="card lock"><h2>Final Rule</h2><p>NO FURTHER CODE WITHOUT EXPLICIT APPROVAL</p></div>
</body></html>`;

fs.writeFileSync(path.join(docsRoot, "Y1191-no-further-code-gate.json"), JSON.stringify(gate, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1191-y1200-no-further-code-gate-report.json"), JSON.stringify({ phase: "Y1191-Y1200", status: "PASS_NO_FURTHER_CODE_WITHOUT_APPROVAL_GATE_READY", gate, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1161-y1200-final-repository-presentation-report.json"), JSON.stringify({ phase: "Y1161-Y1200", status: "PASS_REPOSITORY_PRESENTATION_AND_NO_FURTHER_CODE_GATE_READY", gate, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "no-further-code-gate.html"), html, "utf8");
fs.writeFileSync(path.join(publicRoot, "final-review-hub.html"), finalIndex, "utf8");
fs.writeFileSync(path.join(publicGov, "final-review-hub.html"), finalIndex, "utf8");
fs.writeFileSync(path.join(publicGov, "index.html"), govIndex, "utf8");

console.log("[Y1191-Y1200 PASS_NO_FURTHER_CODE_WITHOUT_APPROVAL_GATE_READY]");
console.log("[Y1161-Y1200 PASS_REPOSITORY_PRESENTATION_AND_NO_FURTHER_CODE_GATE_READY]");
