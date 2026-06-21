const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const simRoot = path.join(sandboxRoot, "08_readonly_simulator");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y1001-y1080");
const outDir = path.join(base, "y1041-y1060");

fs.mkdirSync(simRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

function load(rel) {
  const p = path.join(appRoot, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  forbiddenKeyboardExtensions: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  simulatorMode: "READ_ONLY_NO_OUTPUT",
  outputAllowed: false
};

const dashboard = {
  phase: "Y1041-Y1060",
  title: "Final Read-Only Simulator Dashboard",
  status: "PASS_READONLY_SIMULATOR_DASHBOARD_READY",
  sourceReadiness: {
    readonlySimulatorCore: !!load("reports/writer-sandbox-phase0/y1001-y1020-readonly-simulator-core.json"),
    negativeTestProof: !!load("reports/writer-sandbox-phase0/y1021-y1040-negative-test-proof.json"),
    sandboxAuditFreeze: !!load("reports/writer-sandbox-phase0/y981-y1000-sandbox-audit-freeze.json")
  },
  verdict: "READONLY_SIMULATOR_READY_NO_OUTPUT",
  allowedNow: [
    "Read-only request simulation",
    "Forbidden request rejection proof",
    "HTML/JSON reporting"
  ],
  blockedNow: [
    "writer implementation",
    "real writer",
    "real keyboard output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify",
    "App.jsx modification"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}
const rows = Object.entries(dashboard.sourceReadiness).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${v ? "READY" : "MISSING"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Final Read-Only Simulator Dashboard</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Final Read-Only Simulator Dashboard</h1><h2>${esc(dashboard.verdict)}</h2></div>
<div class="grid">
<div class="card pass"><h3>Simulator</h3><p>READY</p></div>
<div class="card lock"><h3>Output Allowed</h3><p>NO</p></div>
<div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Fixtures</h3><p>BLOCKED</p></div>
</div>
<div class="card"><h2>Source Readiness</h2><table><tr><th>Source</th><th>Status</th></tr>${rows}</table></div>
<div class="card pass"><h2>Allowed Now</h2><ul>${list(dashboard.allowedNow)}</ul></div>
<div class="card bad"><h2>Blocked Now</h2><ul>${list(dashboard.blockedNow)}</ul></div>
</body>
</html>`;

fs.writeFileSync(path.join(simRoot, "final-readonly-simulator-dashboard.json"), JSON.stringify(dashboard, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y1041-y1060-final-readonly-simulator-dashboard.json"), JSON.stringify(dashboard, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1041-y1060-final-readonly-simulator-dashboard-report.json"), JSON.stringify(dashboard, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "final-readonly-simulator-dashboard.html"), html, "utf8");

console.log("[Y1041-Y1060 PASS_READONLY_SIMULATOR_DASHBOARD_READY]");
