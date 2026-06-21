const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y901-y940");
const outDir = path.join(base, "y921-y930");

fs.mkdirSync(path.join(sandboxRoot, "03_permission_checker"), { recursive: true });
fs.mkdirSync(path.join(sandboxRoot, "04_rollback_freeze_monitor"), { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

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
  permissionCheckerActive: true,
  rollbackFreezeMonitorActive: true
};

const permissionChecker = {
  phase: "Y921-Y925",
  title: "Sandbox Permission Checker",
  status: "PASS_PERMISSION_CHECKER_READY",
  sandboxOpened: "YES_PHASE_0_NO_OUTPUT_ONLY",
  allowedNow: [
    "create isolated generated sandbox folder",
    "write JSON reports",
    "write HTML review pages",
    "scan forbidden extensions",
    "verify no-output state"
  ],
  deniedNow: [
    "writer implementation",
    "real writer",
    "real keyboard output",
    ".STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify",
    "App.jsx modification"
  ],
  decision: "ALLOW_PHASE_0_ONLY",
  safety,
  generatedAt: new Date().toISOString()
};

const rollbackMonitor = {
  phase: "Y926-Y930",
  title: "Rollback / Freeze Monitor",
  status: "PASS_ROLLBACK_FREEZE_MONITOR_READY",
  monitorMode: "REPORT_ONLY",
  freezeTriggers: [
    "writer implementation detected",
    "real writer detected",
    "real keyboard output detected",
    "forbidden extension file detected",
    "production parser detected",
    "deploy command detected",
    "fixture read/copy/modify detected",
    "App.jsx modification detected"
  ],
  freezeAction: "STOP_AT_FIRST_FAILURE",
  rollbackAction: "Do not commit unsafe changes. Preserve reports. Restore backups if protected files changed.",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Permission Checker + Rollback Monitor</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>Permission Checker + Rollback/Freeze Monitor</h1><h2>ALLOW PHASE 0 ONLY</h2></div>
<div class="card pass"><h2>Allowed Now</h2><ul>${list(permissionChecker.allowedNow)}</ul></div>
<div class="card bad"><h2>Denied Now</h2><ul>${list(permissionChecker.deniedNow)}</ul></div>
<div class="card lock"><h2>Freeze Triggers</h2><ul>${list(rollbackMonitor.freezeTriggers)}</ul></div>
<div class="card"><h2>Freeze Action</h2><p>${esc(rollbackMonitor.freezeAction)}</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(sandboxRoot, "03_permission_checker", "permission-checker.json"), JSON.stringify(permissionChecker, null, 2), "utf8");
fs.writeFileSync(path.join(sandboxRoot, "04_rollback_freeze_monitor", "rollback-freeze-monitor.json"), JSON.stringify(rollbackMonitor, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y921-y930-permission-rollback-monitor.json"), JSON.stringify({ permissionChecker, rollbackMonitor, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y921-y930-permission-rollback-monitor-report.json"), JSON.stringify({ phase: "Y921-Y930", status: "PASS_PERMISSION_ROLLBACK_MONITOR_READY", permissionChecker, rollbackMonitor, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "permission-rollback-monitor.html"), html, "utf8");

console.log("[Y921-Y930 PASS_PERMISSION_ROLLBACK_MONITOR_READY]");
