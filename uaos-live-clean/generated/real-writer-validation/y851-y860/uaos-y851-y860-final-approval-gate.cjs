const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "writer-approval");
const reportsRoot = path.join(appRoot, "reports", "writer-approval");
const publicRoot = path.join(appRoot, "public", "governance", "y821-y860");
const publicGovRoot = path.join(appRoot, "public", "governance");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y851-y860");

fs.mkdirSync(specRoot, { recursive: true });
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
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  approvalOnly: true
};

const manualChecklist = {
  phase: "Y851-Y855",
  title: "Manual Approval Checklist",
  status: "PASS_MANUAL_APPROVAL_CHECKLIST_READY",
  currentApproval: "NOT_APPROVED",
  checklist: [
    { id: "APPROVAL-001", item: "Confirm writer implementation remains blocked", required: true, current: "BLOCKED" },
    { id: "APPROVAL-002", item: "Confirm real keyboard output remains blocked", required: true, current: "BLOCKED" },
    { id: "APPROVAL-003", item: "Confirm production parser remains blocked", required: true, current: "BLOCKED" },
    { id: "APPROVAL-004", item: "Confirm deploy/public release remains blocked", required: true, current: "BLOCKED" },
    { id: "APPROVAL-005", item: "Confirm fixtures read/copy/modify remains blocked", required: true, current: "BLOCKED" },
    { id: "APPROVAL-006", item: "Review risk matrix", required: true, current: "REVIEW_REQUIRED" },
    { id: "APPROVAL-007", item: "Review rollback/freeze policy", required: true, current: "REVIEW_REQUIRED" },
    { id: "APPROVAL-008", item: "Review sandbox permission model", required: true, current: "REVIEW_REQUIRED" },
    { id: "APPROVAL-009", item: "Give separate explicit approval before any future sandbox phase", required: true, current: "NOT_APPROVED" }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const finalGate = {
  phase: "Y856-Y860",
  title: "Final Writer Sandbox Approval Gate",
  status: "PASS_WRITER_SANDBOX_APPROVAL_GATE_READY_NO_GO",
  finalDecisionNow: "NO_GO",
  approvalGateReady: "READY",
  sandboxOpened: "NO",
  implementationAllowed: "NO",
  realOutputAllowed: "NO",
  productionParserAllowed: "NO",
  deployAllowed: "NO",
  fixturesTouchAllowed: "NO",
  sourceReadiness: {
    approvalTextScope: !!load("reports/writer-approval/y821-y830-approval-text-scope.json"),
    riskMatrixGoNoGo: !!load("reports/writer-approval/y831-y840-risk-matrix-go-no-go.json"),
    permissionRollbackFreeze: !!load("reports/writer-approval/y841-y850-permission-rollback-freeze.json"),
    manualChecklist: true
  },
  nextSafePhase: "Y861-Y900 Final Pre-Writer Governance Pack only",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = manualChecklist.checklist.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.item)}</td><td>${esc(x.current)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Final Writer Sandbox Approval Gate</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card">
    <h1>UAOS Final Writer Sandbox Approval Gate</h1>
    <h2 class="bad">Final Decision Now: NO-GO</h2>
    <p>Approval gate is ready. Sandbox is not opened. Writer remains blocked.</p>
  </div>
  <div class="grid">
    <div class="card pass"><h3>Approval Gate</h3><p>READY</p></div>
    <div class="card bad"><h3>Sandbox Opened</h3><p>NO</p></div>
    <div class="card lock"><h3>Writer Implementation</h3><p>NO</p></div>
    <div class="card lock"><h3>Real Output</h3><p>NO</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>NO</p></div>
    <div class="card lock"><h3>Deploy</h3><p>NO</p></div>
    <div class="card lock"><h3>Fixtures Touch</h3><p>NO</p></div>
  </div>
  <div class="card">
    <h2>Manual Approval Checklist</h2>
    <table><tr><th>ID</th><th>Item</th><th>Current</th></tr>${rows}</table>
  </div>
  <div class="card">
    <h2>Review Pages</h2>
    <p><a href="./index.html">Approval Text + Scope</a></p>
    <p><a href="./risk-matrix-go-no-go.html">Risk Matrix + Go/No-Go</a></p>
    <p><a href="./permission-rollback-freeze.html">Permission + Rollback/Freeze</a></p>
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
<div class="card"><h1>UAOS Governance Index</h1><p>Pre-writer governance and conformance review pages.</p></div>
<div class="card pass"><h2>Available</h2>
<p><a href="./y781-y820/final-conformance-report.html">Y781-Y820 Final Conformance Design Report</a></p>
<p><a href="./y821-y860/final-approval-gate.html">Y821-Y860 Final Writer Sandbox Approval Gate</a></p>
</div>
<div class="card lock"><h2>Blocked Capabilities</h2><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED</p></div>
</body></html>`;

fs.writeFileSync(path.join(specRoot, "Y851-manual-approval-checklist.json"), JSON.stringify(manualChecklist, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y856-final-writer-sandbox-approval-gate.json"), JSON.stringify(finalGate, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y851-y860-final-approval-gate.json"), JSON.stringify({ manualChecklist, finalGate, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y851-y860-final-approval-gate-report.json"), JSON.stringify({ phase: "Y851-Y860", status: "PASS_WRITER_SANDBOX_APPROVAL_GATE_READY_NO_GO", manualChecklist, finalGate, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "final-approval-gate.html"), html, "utf8");
fs.writeFileSync(path.join(publicGovRoot, "index.html"), govIndex, "utf8");

console.log("[Y851-Y860 PASS_WRITER_SANDBOX_APPROVAL_GATE_READY_NO_GO]");
