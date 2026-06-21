const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1241-y1280");
const docsRoot = path.join(appRoot, "reports", "official-path-selection");
const publicRoot = path.join(appRoot, "public", "governance", "y1241-y1280");
const publicGov = path.join(appRoot, "public", "governance");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(publicGov, { recursive: true });

const safety = {
  selectedPath: "PATH-DOCS-UI",
  pathLocked: true,
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  forbiddenKeyboardExtensions: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  outputAllowed: false,
  operationalCode: "NO",
  docsOnly: true,
  noFurtherCodeGate: "ACTIVE",
  commercialProduct: "NO"
};

const finalPack = {
  phase: "Y1241-Y1280",
  title: "Final Official Docs/UI Path Lock Pack",
  status: "PASS_OFFICIAL_DOCS_UI_PATH_LOCKED",
  selectedPath: "PATH-DOCS-UI",
  pathLocked: true,
  officialMeaning: "All future work under this decision is Docs/UI only.",
  completed: [
    "Y1241-Y1250 Official Docs/UI path selection record",
    "Y1251-Y1260 Docs/UI path working rules",
    "Y1261-Y1270 Official path dashboard",
    "Y1271-Y1280 Final official path lock pack"
  ],
  finalState: {
    officialPathSelection: "READY",
    docsUiWorkingRules: "READY",
    officialPathDashboard: "READY",
    finalOfficialPathLock: "READY",
    selectedPath: "PATH-DOCS-UI",
    pathLocked: true,
    noFurtherCodeGate: "ACTIVE",
    outputAllowed: "NO",
    writerImplementation: "BLOCKED",
    realWriter: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deployPublicRelease: "BLOCKED",
    fixturesReadCopyModify: "BLOCKED",
    appJsxModified: false,
    operationalCode: "NO",
    commercialProduct: "NO"
  },
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# Final Official Docs/UI Path Lock Pack

## Status

PASS_OFFICIAL_DOCS_UI_PATH_LOCKED

## Selected Path

PATH-DOCS-UI

## Path Locked

true

## Meaning

All future work under this decision is Docs/UI only.

## Final State

- No-further-code gate: ACTIVE
- Output allowed: NO
- Writer implementation: BLOCKED
- Real writer: BLOCKED
- Real keyboard output: BLOCKED
- Production parser: BLOCKED
- Deploy/public release: BLOCKED
- Fixtures read/copy/modify: BLOCKED
- App.jsx modified: false
- Operational code: NO
- Commercial product: NO
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const stateRows = Object.entries(finalPack.finalState).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Official Docs/UI Path Lock</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Official Docs/UI Path Lock</h1><h2 class="pass">PASS_OFFICIAL_DOCS_UI_PATH_LOCKED</h2><p>Selected Path: PATH-DOCS-UI</p></div>
<div class="grid">
<div class="card pass"><h3>Official Selection</h3><p>READY</p></div>
<div class="card pass"><h3>Working Rules</h3><p>READY</p></div>
<div class="card pass"><h3>Dashboard</h3><p>READY</p></div>
<div class="card lock"><h3>No Further Code Gate</h3><p>ACTIVE</p></div>
<div class="card lock"><h3>Operational Code</h3><p>NO</p></div>
<div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
</div>
<div class="card"><h2>Final State</h2><table><tr><th>Item</th><th>Status</th></tr>${stateRows}</table></div>
<div class="card"><h2>Pages</h2>
<p><a href="./official-docs-ui-selection.html">Official Docs/UI Selection</a></p>
<p><a href="./docs-ui-working-rules.html">Docs/UI Working Rules</a></p>
<p><a href="./official-path-dashboard.html">Official Path Dashboard</a></p>
</div>
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
<div class="card"><h1>UAOS Governance Index</h1><p>Official Docs/UI path is selected and locked.</p></div>
<div class="card pass"><h2>Main Pages</h2>
<p><a href="./final-master-index.html">Final Master Index</a></p>
<p><a href="./y1201-y1240/explicit-next-phase-approval-pack.html">Y1201-Y1240 Approval Pack</a></p>
<p><a href="./y1241-y1280/official-docs-ui-path-lock.html">Y1241-Y1280 Official Docs/UI Path Lock</a></p>
</div>
<div class="card lock"><h2>Selected Path</h2><p>PATH-DOCS-UI</p><p>Operational code: NO</p></div>
</body></html>`;

fs.writeFileSync(path.join(docsRoot, "Y1280-final-official-docs-ui-path-lock.json"), JSON.stringify(finalPack, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1280-final-official-docs-ui-path-lock.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1271-y1280-final-official-path-lock-report.json"), JSON.stringify({ phase: "Y1271-Y1280", status: "PASS_FINAL_OFFICIAL_PATH_LOCK_READY", finalPack, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1241-y1280-final-official-docs-ui-path-lock-report.json"), JSON.stringify({ phase: "Y1241-Y1280", status: "PASS_OFFICIAL_DOCS_UI_PATH_LOCKED", finalPack, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "official-docs-ui-path-lock.html"), html, "utf8");
fs.writeFileSync(path.join(publicGov, "official-docs-ui-path-lock.html"), html, "utf8");
fs.writeFileSync(path.join(publicGov, "index.html"), govIndex, "utf8");

console.log("[Y1271-Y1280 PASS_FINAL_OFFICIAL_PATH_LOCK_READY]");
console.log("[Y1241-Y1280 PASS_OFFICIAL_DOCS_UI_PATH_LOCKED]");
