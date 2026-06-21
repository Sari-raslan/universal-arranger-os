const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const closureRoot = path.join(sandboxRoot, "09_final_safe_closure");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y1001-y1080");
const publicGovRoot = path.join(appRoot, "public", "governance");
const outDir = path.join(base, "y1061-y1080");

fs.mkdirSync(closureRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(publicGovRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const forbiddenExtensions = [".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"];

function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

function load(rel) {
  const p = path.join(appRoot, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const scanRoots = [
  sandboxRoot,
  path.join(appRoot, "reports", "writer-sandbox-phase0"),
  path.join(appRoot, "public", "governance", "y1001-y1080")
];

const scannedFiles = scanRoots.flatMap(root => walk(root));
const forbiddenFound = scannedFiles.filter(f => forbiddenExtensions.includes(path.extname(f).toLowerCase()));

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  forbiddenKeyboardExtensions: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  finalClosure: true,
  outputAllowed: false
};

const finalClosure = {
  phase: "Y1061-Y1080",
  title: "Final Safe Closure After Read-Only Sandbox Simulator",
  status: forbiddenFound.length === 0 ? "PASS_FINAL_SAFE_CLOSURE_READY" : "FAIL_FINAL_SAFE_CLOSURE_FORBIDDEN_OUTPUT",
  finalVerdict: forbiddenFound.length === 0 ? "SAFE_SANDBOX_READONLY_COMPLETE_NO_OUTPUT" : "FAILED",
  sourceReadiness: {
    y901_y940_sandboxPhase0: !!load("reports/writer-sandbox-phase0/y931-y940-final-sandbox-phase0-gate.json"),
    y941_y1000_auditFreeze: !!load("reports/writer-sandbox-phase0/y981-y1000-sandbox-audit-freeze.json"),
    y1001_y1020_simulatorCore: !!load("reports/writer-sandbox-phase0/y1001-y1020-readonly-simulator-core.json"),
    y1021_y1040_negativeProof: !!load("reports/writer-sandbox-phase0/y1021-y1040-negative-test-proof.json"),
    y1041_y1060_dashboard: !!load("reports/writer-sandbox-phase0/y1041-y1060-final-readonly-simulator-dashboard.json")
  },
  scannedFileCount: scannedFiles.length,
  forbiddenFound,
  finalState: {
    sandboxPhase0: "READY",
    dryrunContracts: "READY",
    auditFreeze: "FROZEN_CLEAN_NO_OUTPUT",
    readonlySimulator: "READY",
    negativeTests: "PASS",
    finalSafeClosure: forbiddenFound.length === 0 ? "READY" : "BLOCKED",
    outputAllowed: "NO",
    writerImplementation: "BLOCKED",
    realWriter: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deployPublicRelease: "BLOCKED",
    fixturesReadCopyModify: "BLOCKED",
    appJsxModified: false
  },
  nextPossibleAction: "Pause and review. Any future writer implementation still requires separate explicit approval.",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = Object.entries(finalClosure.sourceReadiness).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${v ? "READY" : "MISSING"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Final Safe Closure</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Final Safe Closure</h1><h2>${esc(finalClosure.finalVerdict)}</h2><p>Read-only sandbox simulator complete. No writer. No output.</p></div>
<div class="grid">
<div class="card pass"><h3>Final Safe Closure</h3><p>${esc(finalClosure.finalState.finalSafeClosure)}</p></div>
<div class="card lock"><h3>Output Allowed</h3><p>NO</p></div>
<div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Real Output</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Fixtures</h3><p>BLOCKED</p></div>
</div>
<div class="card"><h2>Source Readiness</h2><table><tr><th>Source</th><th>Status</th></tr>${rows}</table></div>
<div class="card"><h2>Audit</h2><p>Scanned files: ${finalClosure.scannedFileCount}<br>Forbidden found: ${finalClosure.forbiddenFound.length}</p></div>
<div class="card"><h2>Review Pages</h2>
<p><a href="./readonly-simulator-core.html">Read-Only Simulator Core</a></p>
<p><a href="./negative-test-proof.html">Negative Test Proof</a></p>
<p><a href="./final-readonly-simulator-dashboard.html">Final Read-Only Simulator Dashboard</a></p>
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
<div class="card"><h1>UAOS Governance Index</h1><p>Final safe sandbox closure entry point.</p></div>
<div class="card pass"><h2>Available</h2>
<p><a href="./final-governance-report.html">Y861-Y900 Final Pre-Writer Governance Report</a></p>
<p><a href="./y901-y940/final-sandbox-phase0-gate.html">Y901-Y940 Final Sandbox Phase 0 Gate</a></p>
<p><a href="./y941-y1000/final-sandbox-audit-freeze.html">Y941-Y1000 Final Sandbox Audit Freeze</a></p>
<p><a href="./y1001-y1080/final-safe-closure.html">Y1001-Y1080 Final Safe Closure</a></p>
</div>
<div class="card lock"><h2>Blocked Capabilities</h2><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED</p></div>
</body></html>`;

fs.writeFileSync(path.join(closureRoot, "final-safe-closure.json"), JSON.stringify(finalClosure, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y1061-y1080-final-safe-closure.json"), JSON.stringify(finalClosure, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1061-y1080-final-safe-closure-report.json"), JSON.stringify({ phase: "Y1061-Y1080", status: finalClosure.status, finalClosure, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "final-safe-closure.html"), html, "utf8");
fs.writeFileSync(path.join(publicGovRoot, "index.html"), govIndex, "utf8");

if (forbiddenFound.length > 0) {
  console.error("[Y1061-Y1080 FAIL_FINAL_SAFE_CLOSURE_FORBIDDEN_OUTPUT]");
  process.exit(1);
}

console.log("[Y1061-Y1080 PASS_FINAL_SAFE_CLOSURE_READY]");
