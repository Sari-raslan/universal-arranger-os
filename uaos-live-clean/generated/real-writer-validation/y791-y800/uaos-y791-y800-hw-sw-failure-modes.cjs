const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "conformance");
const reportsRoot = path.join(appRoot, "reports", "conformance");
const publicRoot = path.join(appRoot, "public", "governance", "y781-y820");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y791-y800");

fs.mkdirSync(specRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const safety = {
  writer: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  designOnly: true,
  noOutputQa: true
};

const hwSwChecklist = {
  phase: "Y791-Y796",
  title: "Hardware / Software Validation Checklist Design",
  status: "PASS_HW_SW_CHECKLIST_DESIGN_READY",
  note: "This is a future validation design only. No device files are generated and no hardware output is produced.",
  checklist: [
    { id: "HW-001", target: "KORG family", validationNeeded: "Future conformance profile only", currentStatus: "BLOCKED_NO_REAL_OUTPUT" },
    { id: "HW-002", target: "Yamaha family", validationNeeded: "Future conformance profile only", currentStatus: "BLOCKED_NO_REAL_OUTPUT" },
    { id: "HW-003", target: "Roland family", validationNeeded: "Future conformance profile only", currentStatus: "BLOCKED_NO_REAL_OUTPUT" },
    { id: "HW-004", target: "Ketron family", validationNeeded: "Future conformance profile only", currentStatus: "BLOCKED_NO_REAL_OUTPUT" },
    { id: "SW-001", target: "Local demo browser", validationNeeded: "HTML/report display only", currentStatus: "READY_FOR_REVIEW" },
    { id: "SW-002", target: "Generated reports", validationNeeded: "JSON parse + safety fields", currentStatus: "READY_FOR_REVIEW" },
    { id: "SW-003", target: "Build system", validationNeeded: "npm run build", currentStatus: "REQUIRED_EACH_GROUP" }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const failureModes = {
  phase: "Y797-Y800",
  title: "Failure Modes Design",
  status: "PASS_FAILURE_MODES_DESIGN_READY",
  modes: [
    { id: "FM-001", failure: "Writer implementation detected", severity: "CRITICAL", action: "STOP_IMMEDIATELY" },
    { id: "FM-002", failure: "Forbidden keyboard output extension created", severity: "CRITICAL", action: "STOP_IMMEDIATELY" },
    { id: "FM-003", failure: "Fixture read/copy/modify detected", severity: "CRITICAL", action: "STOP_IMMEDIATELY" },
    { id: "FM-004", failure: "Production parser bridge detected", severity: "CRITICAL", action: "STOP_IMMEDIATELY" },
    { id: "FM-005", failure: "Deploy/public release command detected", severity: "CRITICAL", action: "STOP_IMMEDIATELY" },
    { id: "FM-006", failure: "App.jsx modification detected", severity: "CRITICAL", action: "STOP_IMMEDIATELY" },
    { id: "FM-007", failure: "Missing safety field in JSON report", severity: "HIGH", action: "FAIL_GATE" },
    { id: "FM-008", failure: "Missing public HTML review page", severity: "MEDIUM", action: "FAIL_GATE" }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}

const checkRows = hwSwChecklist.checklist.map(x => `
<tr><td>${esc(x.id)}</td><td>${esc(x.target)}</td><td>${esc(x.validationNeeded)}</td><td>${esc(x.currentStatus)}</td></tr>`).join("\n");

const modeRows = failureModes.modes.map(x => `
<tr><td>${esc(x.id)}</td><td>${esc(x.failure)}</td><td>${esc(x.severity)}</td><td>${esc(x.action)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS HW/SW Checklist + Failure Modes</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px;vertical-align:top}
    .lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card"><h1>UAOS HW/SW Checklist + Failure Modes</h1><p>Design only. No real keyboard output.</p></div>
  <div class="card"><h2>Hardware / Software Checklist</h2><table><tr><th>ID</th><th>Target</th><th>Validation Needed</th><th>Status</th></tr>${checkRows}</table></div>
  <div class="card"><h2>Failure Modes</h2><table><tr><th>ID</th><th>Failure</th><th>Severity</th><th>Action</th></tr>${modeRows}</table></div>
  <div class="card lock"><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED | App.jsx: NOT MODIFIED</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y791-hw-sw-checklist.json"), JSON.stringify(hwSwChecklist, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y797-failure-modes.json"), JSON.stringify(failureModes, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y791-y800-hw-sw-failure-modes.json"), JSON.stringify({ hwSwChecklist, failureModes, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y791-y800-hw-sw-failure-modes-report.json"), JSON.stringify({ phase: "Y791-Y800", status: "PASS_HW_SW_FAILURE_MODES_READY", hwSwChecklist, failureModes, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "hw-sw-failure-modes.html"), html, "utf8");

console.log("[Y791-Y800 PASS_HW_SW_FAILURE_MODES_READY]");
