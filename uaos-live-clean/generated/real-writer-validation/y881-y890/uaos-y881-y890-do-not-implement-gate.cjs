const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "pre-writer-governance");
const reportsRoot = path.join(appRoot, "reports", "pre-writer-governance");
const publicRoot = path.join(appRoot, "public", "governance", "y861-y900");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y881-y890");

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

const doNotImplementGate = {
  phase: "Y881-Y890",
  title: "Do-Not-Implement Until Approved Gate",
  status: "PASS_DO_NOT_IMPLEMENT_GATE_READY",
  gateState: "ACTIVE",
  implementationAllowed: "NO",
  requiredInstruction: "DO NOT IMPLEMENT UNTIL APPROVED",
  blockedActions: [
    "Do not implement writer.",
    "Do not implement real writer.",
    "Do not create real keyboard output.",
    "Do not create .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST files.",
    "Do not connect production parser.",
    "Do not deploy.",
    "Do not touch App.jsx.",
    "Do not read/copy/modify fixtures."
  ],
  futureApprovalMustInclude: [
    "Exact phase scope",
    "Allowed file paths",
    "Forbidden file extensions",
    "Rollback plan",
    "No-output status or explicitly approved output status",
    "Human approval text",
    "Stop-at-first-failure rule"
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
  <title>UAOS Do Not Implement Gate</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{background:#2a1111;border:1px solid #aa4444;border-radius:16px;padding:24px;margin:14px 0}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    .bad{color:#ff8080}.lock{color:#ffcc66}.pass{color:#80ffb0}
  </style>
</head>
<body>
  <div class="hero">
    <h1>DO NOT IMPLEMENT UNTIL APPROVED</h1>
    <h2>Implementation Allowed: NO</h2>
    <p>This gate is active. It blocks writer, output, parser, deploy, App.jsx, and fixtures.</p>
  </div>
  <div class="card bad"><h2>Blocked Actions</h2><ul>${list(doNotImplementGate.blockedActions)}</ul></div>
  <div class="card lock"><h2>Future Approval Must Include</h2><ul>${list(doNotImplementGate.futureApprovalMustInclude)}</ul></div>
  <div class="card pass"><h2>Allowed Now</h2><p>Governance reports and public HTML only.</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y881-do-not-implement-gate.json"), JSON.stringify(doNotImplementGate, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y881-y890-do-not-implement-gate.json"), JSON.stringify(doNotImplementGate, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y881-y890-do-not-implement-gate-report.json"), JSON.stringify({ phase: "Y881-Y890", status: "PASS_DO_NOT_IMPLEMENT_GATE_READY", doNotImplementGate, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "do-not-implement-gate.html"), html, "utf8");

console.log("[Y881-Y890 PASS_DO_NOT_IMPLEMENT_GATE_READY]");
