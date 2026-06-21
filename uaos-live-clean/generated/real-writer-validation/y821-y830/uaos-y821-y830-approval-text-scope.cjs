const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "writer-approval");
const reportsRoot = path.join(appRoot, "reports", "writer-approval");
const publicRoot = path.join(appRoot, "public", "governance", "y821-y860");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y821-y830");

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
  approvalOnly: true
};

const approvalText = {
  phase: "Y821-Y825",
  title: "Writer Sandbox Approval Text",
  status: "PASS_APPROVAL_TEXT_READY",
  approvalStatusNow: "NOT_APPROVED",
  textForFutureManualApproval: [
    "I approve opening a limited writer sandbox planning phase only.",
    "I do not approve real keyboard output generation.",
    "I do not approve production parser integration.",
    "I do not approve deploy or public release.",
    "I do not approve fixture read/copy/modify.",
    "I understand any future writer sandbox must remain isolated and rollback-gated."
  ],
  notApprovedNow: [
    "writer implementation",
    "real writer",
    "real keyboard output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const approvalScope = {
  phase: "Y826-Y830",
  title: "Approval Scope Definition",
  status: "PASS_APPROVAL_SCOPE_READY",
  allowedNow: [
    "approval text",
    "risk matrix",
    "go/no-go gate",
    "sandbox permission model",
    "rollback/freeze policy",
    "manual approval checklist",
    "public HTML reports",
    "generated JSON reports"
  ],
  blockedNow: approvalText.notApprovedNow,
  futureTransitionCondition: "Separate explicit manual approval after all blocker matrices are green.",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Writer Sandbox Approval Gate</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card">
    <h1>UAOS Writer Sandbox Approval Gate</h1>
    <h2>Y821-Y830 Approval Text + Scope</h2>
    <p>This is approval governance only. No writer is implemented.</p>
  </div>
  <div class="card lock">
    <h2>Approval Status Now</h2>
    <p>NOT APPROVED</p>
  </div>
  <div class="card pass">
    <h2>Future Manual Approval Text Draft</h2>
    <ul>${list(approvalText.textForFutureManualApproval)}</ul>
  </div>
  <div class="card bad">
    <h2>Blocked Now</h2>
    <ul>${list(approvalScope.blockedNow)}</ul>
  </div>
  <div class="card lock">
    <h2>Safety</h2>
    <p>Writer implementation: BLOCKED<br>Real writer: BLOCKED<br>Real keyboard output: BLOCKED<br>Production parser: BLOCKED<br>Deploy/Public release: BLOCKED<br>Fixtures touch: BLOCKED<br>App.jsx: NOT MODIFIED</p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y821-approval-text.json"), JSON.stringify(approvalText, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y826-approval-scope.json"), JSON.stringify(approvalScope, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y821-y830-approval-text-scope.json"), JSON.stringify({ approvalText, approvalScope, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y821-y830-approval-text-scope-report.json"), JSON.stringify({ phase: "Y821-Y830", status: "PASS_APPROVAL_TEXT_SCOPE_READY", approvalText, approvalScope, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "index.html"), html, "utf8");

console.log("[Y821-Y830 PASS_APPROVAL_TEXT_SCOPE_READY]");
