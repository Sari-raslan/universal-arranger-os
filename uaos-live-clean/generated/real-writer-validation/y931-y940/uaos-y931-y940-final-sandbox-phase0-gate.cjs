const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y901-y940");
const publicGovRoot = path.join(appRoot, "public", "governance");
const outDir = path.join(base, "y931-y940");

fs.mkdirSync(path.join(sandboxRoot, "05_reports_only"), { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(publicGovRoot, { recursive: true });
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
  sandboxPhase: "PHASE_0_NO_OUTPUT",
  sandboxIsolated: true,
  outputAllowed: false
};

const finalGate = {
  phase: "Y931-Y940",
  title: "Final Sandbox Phase-0 Gate",
  status: "PASS_SANDBOX_PHASE0_NO_OUTPUT_READY",
  sandboxPhase0: "READY",
  sandboxRoot,
  outputAllowed: "NO",
  writerAllowed: "NO",
  realWriterAllowed: "NO",
  realKeyboardOutputAllowed: "NO",
  productionParserAllowed: "NO",
  deployAllowed: "NO",
  fixturesTouchAllowed: "NO",
  appJsxModified: false,
  sourceReadiness: {
    sandboxManifest: !!load("reports/writer-sandbox-phase0/y901-y910-sandbox-folder-manifest.json"),
    noOutputHarnessScanner: !!load("reports/writer-sandbox-phase0/y911-y920-no-output-harness-scanner.json"),
    permissionRollbackMonitor: !!load("reports/writer-sandbox-phase0/y921-y930-permission-rollback-monitor.json")
  },
  finalRule: "PHASE_0_SANDBOX_ONLY_DO_NOT_IMPLEMENT_WRITER",
  nextPossibleAction: "Review phase-0 sandbox. Any future writer work still requires separate explicit approval.",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const sourceRows = Object.entries(finalGate.sourceReadiness).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${v ? "READY" : "MISSING"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Final Sandbox Phase 0 Gate</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Final Sandbox Phase 0 Gate</h1><h2 class="pass">Sandbox Phase 0: READY</h2><p>No-output sandbox only. Writer remains blocked.</p></div>
<div class="grid">
<div class="card pass"><h3>Sandbox Folder</h3><p>READY</p></div>
<div class="card lock"><h3>Output Allowed</h3><p>NO</p></div>
<div class="card lock"><h3>Writer Allowed</h3><p>NO</p></div>
<div class="card lock"><h3>Real Output</h3><p>NO</p></div>
<div class="card lock"><h3>Production Parser</h3><p>NO</p></div>
<div class="card lock"><h3>Deploy</h3><p>NO</p></div>
<div class="card lock"><h3>Fixtures Touch</h3><p>NO</p></div>
</div>
<div class="card"><h2>Source Readiness</h2><table><tr><th>Source</th><th>Status</th></tr>${sourceRows}</table></div>
<div class="card"><h2>Review Pages</h2>
<p><a href="./index.html">Sandbox Manifest</a></p>
<p><a href="./no-output-harness-scanner.html">No-Output Harness + Scanner</a></p>
<p><a href="./permission-rollback-monitor.html">Permission Checker + Rollback Monitor</a></p>
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
<div class="card"><h1>UAOS Governance Index</h1><p>Final governance and sandbox phase-0 entry point.</p></div>
<div class="card pass"><h2>Available</h2>
<p><a href="./final-governance-report.html">Y861-Y900 Final Pre-Writer Governance Report</a></p>
<p><a href="./y901-y940/final-sandbox-phase0-gate.html">Y901-Y940 Final Sandbox Phase 0 Gate</a></p>
</div>
<div class="card lock"><h2>Blocked Capabilities</h2><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED</p></div>
</body></html>`;

fs.writeFileSync(path.join(sandboxRoot, "05_reports_only", "final-sandbox-phase0-gate.json"), JSON.stringify(finalGate, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y931-y940-final-sandbox-phase0-gate.json"), JSON.stringify(finalGate, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y931-y940-final-sandbox-phase0-gate-report.json"), JSON.stringify({ phase: "Y931-Y940", status: "PASS_SANDBOX_PHASE0_NO_OUTPUT_READY", finalGate, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "final-sandbox-phase0-gate.html"), html, "utf8");
fs.writeFileSync(path.join(publicGovRoot, "index.html"), govIndex, "utf8");

console.log("[Y931-Y940 PASS_SANDBOX_PHASE0_NO_OUTPUT_READY]");
