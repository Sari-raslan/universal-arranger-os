const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "writer-approval");
const reportsRoot = path.join(appRoot, "reports", "writer-approval");
const publicRoot = path.join(appRoot, "public", "governance", "y821-y860");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y841-y850");

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

const permissionModel = {
  phase: "Y841-Y845",
  title: "Sandbox Permission Model",
  status: "PASS_SANDBOX_PERMISSION_MODEL_READY",
  sandboxStatusNow: "NOT_OPENED",
  allowedIfFutureApproved: [
    "Create isolated planning folder only",
    "Create dry-run JSON only",
    "Run no-output gates",
    "Run extension scans",
    "Generate HTML review reports"
  ],
  deniedAlwaysWithoutSeparateApproval: [
    "writer implementation",
    "binary serialization",
    "real keyboard output",
    "production parser bridge",
    "fixture read/copy/modify",
    "deploy/public release",
    "App.jsx modification"
  ],
  requiredBeforeAnyFutureSandbox: [
    "manual approval",
    "risk matrix accepted",
    "rollback/freeze accepted",
    "conformance rules accepted",
    "output remains blocked unless separately approved"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const rollbackFreeze = {
  phase: "Y846-Y850",
  title: "Rollback / Freeze Policy",
  status: "PASS_ROLLBACK_FREEZE_POLICY_READY",
  freezeTriggers: [
    "Any writer implementation detected",
    "Any real output file detected",
    "Any forbidden extension file detected",
    "Any production parser bridge detected",
    "Any fixture read/copy/modify detected",
    "Any deploy/public release command detected",
    "Any App.jsx modification detected"
  ],
  rollbackActions: [
    "Stop immediately",
    "Preserve logs and reports",
    "Do not continue to next phase",
    "Do not commit unsafe files",
    "Restore from backup if protected files changed",
    "Return final failure report"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Sandbox Permission + Rollback Freeze</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card">
    <h1>UAOS Sandbox Permission Model + Rollback/Freeze Policy</h1>
    <h2>Sandbox Status Now: NOT OPENED</h2>
  </div>
  <div class="card pass"><h2>Allowed Only If Future Approved</h2><ul>${list(permissionModel.allowedIfFutureApproved)}</ul></div>
  <div class="card bad"><h2>Denied Without Separate Approval</h2><ul>${list(permissionModel.deniedAlwaysWithoutSeparateApproval)}</ul></div>
  <div class="card lock"><h2>Freeze Triggers</h2><ul>${list(rollbackFreeze.freezeTriggers)}</ul></div>
  <div class="card"><h2>Rollback Actions</h2><ul>${list(rollbackFreeze.rollbackActions)}</ul></div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y841-sandbox-permission-model.json"), JSON.stringify(permissionModel, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y846-rollback-freeze-policy.json"), JSON.stringify(rollbackFreeze, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y841-y850-permission-rollback-freeze.json"), JSON.stringify({ permissionModel, rollbackFreeze, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y841-y850-permission-rollback-freeze-report.json"), JSON.stringify({ phase: "Y841-Y850", status: "PASS_PERMISSION_ROLLBACK_FREEZE_READY", permissionModel, rollbackFreeze, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "permission-rollback-freeze.html"), html, "utf8");

console.log("[Y841-Y850 PASS_PERMISSION_ROLLBACK_FREEZE_READY]");
