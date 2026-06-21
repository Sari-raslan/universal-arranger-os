const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "pre-writer-governance");
const reportsRoot = path.join(appRoot, "reports", "pre-writer-governance");
const publicRoot = path.join(appRoot, "public", "governance", "y861-y900");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y871-y880");

fs.mkdirSync(specRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  governanceOnly: true,
  approvalRequired: true
};

const governanceDashboard = {
  phase: "Y871-Y875",
  title: "Pre-Writer Governance Dashboard",
  status: "PASS_GOVERNANCE_DASHBOARD_READY",
  overallPosture: "NO_GO_UNTIL_APPROVED",
  packages: [
    { id: "Y661-Y700", name: "Local QA Freeze + Handover", state: "READY_OR_EXPECTED_READY" },
    { id: "Y701-Y740", name: "Commercial Readiness Plan", state: "READY_OR_EXPECTED_READY" },
    { id: "Y741-Y780", name: "Writer Specification Only", state: "READY_OR_EXPECTED_READY" },
    { id: "Y781-Y820", name: "Conformance Test Design", state: "READY_OR_EXPECTED_READY" },
    { id: "Y821-Y860", name: "Writer Sandbox Approval Gate", state: "READY_OR_EXPECTED_READY" },
    { id: "Y861-Y900", name: "Final Pre-Writer Governance Pack", state: "IN_PROGRESS" }
  ],
  allowedScope: [
    "specification",
    "conformance design",
    "approval governance",
    "HTML dashboards",
    "JSON reports"
  ],
  blockedScope: [
    "writer implementation",
    "real output",
    "production parser",
    "deploy",
    "commercial release execution",
    "fixtures interaction"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const blockerMatrix = {
  phase: "Y876-Y880",
  title: "Final Pre-Writer Blocker Matrix",
  status: "PASS_PRE_WRITER_BLOCKER_MATRIX_READY",
  blockers: [
    { id: "BLOCK-001", blocker: "Writer implementation not approved", severity: "CRITICAL", state: "BLOCKED", unblockCondition: "Separate explicit approval for a future sandbox phase" },
    { id: "BLOCK-002", blocker: "Real writer not approved", severity: "CRITICAL", state: "BLOCKED", unblockCondition: "Separate explicit approval + sandbox gates" },
    { id: "BLOCK-003", blocker: "Real keyboard output not approved", severity: "CRITICAL", state: "BLOCKED", unblockCondition: "Conformance + hardware validation + separate output approval" },
    { id: "BLOCK-004", blocker: "Production parser not approved", severity: "CRITICAL", state: "BLOCKED", unblockCondition: "Separate parser production approval" },
    { id: "BLOCK-005", blocker: "Deploy/public release not approved", severity: "CRITICAL", state: "BLOCKED", unblockCondition: "Release/legal/commercial gate approval" },
    { id: "BLOCK-006", blocker: "Fixtures read/copy/modify not approved", severity: "CRITICAL", state: "BLOCKED", unblockCondition: "Separate read-only fixture approval phase" },
    { id: "BLOCK-007", blocker: "App.jsx modification not approved", severity: "HIGH", state: "BLOCKED", unblockCondition: "Separate UI integration approval" }
  ],
  allGreen: false,
  goNoGo: "NO_GO",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function rows(items){return items.map(x=>`<tr><td>${esc(x.id||"")}</td><td>${esc(x.blocker||x.name)}</td><td>${esc(x.severity||"")}</td><td>${esc(x.state)}</td><td>${esc(x.unblockCondition||"")}</td></tr>`).join("\n");}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Pre-Writer Governance Dashboard</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px;vertical-align:top}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card">
    <h1>UAOS Pre-Writer Governance Dashboard</h1>
    <h2 class="bad">Overall Posture: NO-GO UNTIL APPROVED</h2>
  </div>
  <div class="card pass"><h2>Allowed Scope</h2><ul>${list(governanceDashboard.allowedScope)}</ul></div>
  <div class="card bad"><h2>Blocked Scope</h2><ul>${list(governanceDashboard.blockedScope)}</ul></div>
  <div class="card">
    <h2>Final Pre-Writer Blocker Matrix</h2>
    <table><tr><th>ID</th><th>Blocker</th><th>Severity</th><th>State</th><th>Unblock Condition</th></tr>${rows(blockerMatrix.blockers)}</table>
  </div>
  <div class="card lock"><h2>Go/No-Go</h2><p>${blockerMatrix.goNoGo}</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y871-governance-dashboard.json"), JSON.stringify(governanceDashboard, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y876-pre-writer-blocker-matrix.json"), JSON.stringify(blockerMatrix, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y871-y880-governance-dashboard-blockers.json"), JSON.stringify({ governanceDashboard, blockerMatrix, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y871-y880-governance-dashboard-blockers-report.json"), JSON.stringify({ phase: "Y871-Y880", status: "PASS_GOVERNANCE_DASHBOARD_BLOCKERS_READY", governanceDashboard, blockerMatrix, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "governance-dashboard.html"), html, "utf8");

console.log("[Y871-Y880 PASS_GOVERNANCE_DASHBOARD_BLOCKERS_READY]");
