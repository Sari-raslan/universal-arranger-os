const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1241-y1280");
const docsRoot = path.join(appRoot, "reports", "official-path-selection");
const publicRoot = path.join(appRoot, "public", "governance", "y1241-y1280");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });

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

const dashboard = {
  phase: "Y1261-Y1270",
  title: "Official Path Dashboard",
  status: "PASS_OFFICIAL_PATH_DASHBOARD_READY",
  selectedPath: "PATH-DOCS-UI",
  pathStatus: "LOCKED",
  pathMeaning: "Docs/UI only. No operational code.",
  readiness: {
    officialSelectionRecord: "READY",
    docsUiWorkingRules: "READY",
    noFurtherCodeGate: "ACTIVE",
    approvalPack: "READY"
  },
  finalLocks: {
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

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const readinessRows = Object.entries(dashboard.readiness).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("\n");
const lockRows = Object.entries(dashboard.finalLocks).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Official Path Dashboard</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Official Path Dashboard</h1><h2 class="pass">PATH-DOCS-UI LOCKED</h2><p>${esc(dashboard.pathMeaning)}</p></div>
<div class="grid">
<div class="card pass"><h3>Selected Path</h3><p>PATH-DOCS-UI</p></div>
<div class="card lock"><h3>No Further Code Gate</h3><p>ACTIVE</p></div>
<div class="card lock"><h3>Operational Code</h3><p>NO</p></div>
<div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Output</h3><p>NO</p></div>
<div class="card lock"><h3>Commercial Product</h3><p>NO</p></div>
</div>
<div class="card"><h2>Readiness</h2><table><tr><th>Item</th><th>Status</th></tr>${readinessRows}</table></div>
<div class="card"><h2>Final Locks</h2><table><tr><th>Item</th><th>Status</th></tr>${lockRows}</table></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1261-official-path-dashboard.json"), JSON.stringify(dashboard, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1261-y1270-official-path-dashboard-report.json"), JSON.stringify({ phase: "Y1261-Y1270", status: "PASS_OFFICIAL_PATH_DASHBOARD_READY", dashboard, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "official-path-dashboard.html"), html, "utf8");

console.log("[Y1261-Y1270 PASS_OFFICIAL_PATH_DASHBOARD_READY]");
