const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const auditRoot = path.join(sandboxRoot, "07_audit_freeze");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y941-y1000");
const publicGovRoot = path.join(appRoot, "public", "governance");
const outDir = path.join(base, "y981-y1000");

fs.mkdirSync(auditRoot, { recursive: true });
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
  path.join(appRoot, "public", "governance", "y941-y1000")
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
  sandboxPhase: "PHASE_0_NO_OUTPUT",
  outputAllowed: false,
  finalFreeze: true
};

const auditRunner = {
  phase: "Y981-Y990",
  title: "Sandbox Audit Runner",
  status: forbiddenFound.length === 0 ? "PASS_SANDBOX_AUDIT_CLEAN" : "FAIL_FORBIDDEN_OUTPUT_FOUND",
  scanRoots,
  scannedFileCount: scannedFiles.length,
  forbiddenExtensions,
  forbiddenFound,
  clean: forbiddenFound.length === 0,
  sourceReadiness: {
    phase0Gate: !!load("reports/writer-sandbox-phase0/y931-y940-final-sandbox-phase0-gate.json"),
    dryrunContracts: !!load("reports/writer-sandbox-phase0/y941-y960-dryrun-interface-contracts.json"),
    auditContracts: !!load("reports/writer-sandbox-phase0/y961-y980-audit-request-contracts.json")
  },
  safety,
  generatedAt: new Date().toISOString()
};

const finalFreeze = {
  phase: "Y991-Y1000",
  title: "Final Sandbox Interface Freeze",
  status: auditRunner.clean ? "PASS_SANDBOX_INTERFACE_FREEZE_READY" : "FAIL_SANDBOX_INTERFACE_FREEZE_BLOCKED",
  freezeState: auditRunner.clean ? "FROZEN_CLEAN_NO_OUTPUT" : "BLOCKED_BY_AUDIT",
  finalVerdict: auditRunner.clean ? "Y941_Y1000_READY_NO_OUTPUT" : "FAILED",
  outputAllowed: "NO",
  writerAllowed: "NO",
  realWriterAllowed: "NO",
  realKeyboardOutputAllowed: "NO",
  productionParserAllowed: "NO",
  deployAllowed: "NO",
  fixturesTouchAllowed: "NO",
  appJsxModified: false,
  nextPossibleAction: "Review only. Any future implementation still requires separate explicit approval.",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const sourceRows = Object.entries(auditRunner.sourceReadiness).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${v ? "READY" : "MISSING"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Final Sandbox Audit Freeze</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Final Sandbox Audit Freeze</h1><h2>${esc(finalFreeze.finalVerdict)}</h2><p>${esc(finalFreeze.freezeState)}</p></div>
<div class="grid">
<div class="card pass"><h3>Audit Clean</h3><p>${auditRunner.clean ? "YES" : "NO"}</p></div>
<div class="card lock"><h3>Output Allowed</h3><p>NO</p></div>
<div class="card lock"><h3>Writer Allowed</h3><p>NO</p></div>
<div class="card lock"><h3>Real Output</h3><p>NO</p></div>
<div class="card lock"><h3>Production Parser</h3><p>NO</p></div>
<div class="card lock"><h3>Deploy</h3><p>NO</p></div>
<div class="card lock"><h3>Fixtures Touch</h3><p>NO</p></div>
</div>
<div class="card"><h2>Source Readiness</h2><table><tr><th>Source</th><th>Status</th></tr>${sourceRows}</table></div>
<div class="card"><h2>Scanned Files</h2><p>${auditRunner.scannedFileCount}</p><h2>Forbidden Found</h2><p>${auditRunner.forbiddenFound.length}</p></div>
<div class="card"><h2>Review Pages</h2>
<p><a href="./dryrun-interface-contracts.html">Dry-Run Interface Contracts</a></p>
<p><a href="./audit-request-contracts.html">Audit + Request Contracts</a></p>
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
<div class="card"><h1>UAOS Governance Index</h1><p>Governance and sandbox review entry point.</p></div>
<div class="card pass"><h2>Available</h2>
<p><a href="./final-governance-report.html">Y861-Y900 Final Pre-Writer Governance Report</a></p>
<p><a href="./y901-y940/final-sandbox-phase0-gate.html">Y901-Y940 Final Sandbox Phase 0 Gate</a></p>
<p><a href="./y941-y1000/final-sandbox-audit-freeze.html">Y941-Y1000 Final Sandbox Audit Freeze</a></p>
</div>
<div class="card lock"><h2>Blocked Capabilities</h2><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED</p></div>
</body></html>`;

fs.writeFileSync(path.join(auditRoot, "sandbox-audit-runner.json"), JSON.stringify(auditRunner, null, 2), "utf8");
fs.writeFileSync(path.join(auditRoot, "final-sandbox-interface-freeze.json"), JSON.stringify(finalFreeze, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y981-y1000-sandbox-audit-freeze.json"), JSON.stringify({ auditRunner, finalFreeze, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y981-y1000-sandbox-audit-freeze-report.json"), JSON.stringify({ phase: "Y981-Y1000", status: auditRunner.clean ? "PASS_SANDBOX_AUDIT_FREEZE_READY_NO_OUTPUT" : "FAIL_SANDBOX_AUDIT_FREEZE", auditRunner, finalFreeze, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "final-sandbox-audit-freeze.html"), html, "utf8");
fs.writeFileSync(path.join(publicGovRoot, "index.html"), govIndex, "utf8");

if (!auditRunner.clean) {
  console.error("[Y981-Y1000 FAIL_SANDBOX_AUDIT_FREEZE]");
  process.exit(1);
}

console.log("[Y981-Y1000 PASS_SANDBOX_AUDIT_FREEZE_READY_NO_OUTPUT]");
