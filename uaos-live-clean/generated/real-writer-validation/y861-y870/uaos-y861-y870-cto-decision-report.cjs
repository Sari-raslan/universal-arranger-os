const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "pre-writer-governance");
const reportsRoot = path.join(appRoot, "reports", "pre-writer-governance");
const publicRoot = path.join(appRoot, "public", "governance", "y861-y900");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y861-y870");

fs.mkdirSync(specRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

function exists(rel) { return fs.existsSync(path.join(appRoot, rel)); }

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

const sourceReadiness = {
  localFrozenProof: exists("public/uaos-final-frozen-local-proof-gate.html"),
  commercialReadiness: exists("public/commercial/final-gate.html"),
  writerSpec: exists("public/writer/final-report.html"),
  conformanceDesign: exists("public/governance/y781-y820/final-conformance-report.html"),
  sandboxApprovalGate: exists("public/governance/y821-y860/final-approval-gate.html")
};

const ctoDecision = {
  phase: "Y861-Y870",
  title: "CTO Decision Report",
  status: "PASS_CTO_DECISION_REPORT_READY",
  decisionNow: "NO_GO",
  decisionReason: "All pre-writer planning and governance artifacts can be reviewed, but implementation is not approved.",
  sourceReadiness,
  allowedNow: [
    "Review governance reports",
    "Review CTO decision report",
    "Review blocker matrix",
    "Review approval-required summary",
    "Prepare separate explicit approval text for a future phase"
  ],
  blockedNow: [
    "writer implementation",
    "real writer",
    "real keyboard output",
    ".STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify",
    "App.jsx modification"
  ],
  transitionCondition: "Only a separate explicit manual approval can start a future gated sandbox phase. This package does not approve implementation.",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}
const sourceRows = Object.entries(sourceReadiness).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${v ? "READY/FOUND" : "MISSING/NOT FOUND"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS CTO Decision Report</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card">
    <h1>UAOS CTO Decision Report</h1>
    <h2 class="bad">Decision Now: NO-GO</h2>
    <p>${esc(ctoDecision.decisionReason)}</p>
  </div>
  <div class="card">
    <h2>Source Readiness</h2>
    <table><tr><th>Source</th><th>Status</th></tr>${sourceRows}</table>
  </div>
  <div class="card pass"><h2>Allowed Now</h2><ul>${list(ctoDecision.allowedNow)}</ul></div>
  <div class="card bad"><h2>Blocked Now</h2><ul>${list(ctoDecision.blockedNow)}</ul></div>
  <div class="card lock"><h2>Transition Condition</h2><p>${esc(ctoDecision.transitionCondition)}</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y861-cto-decision-report.json"), JSON.stringify(ctoDecision, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y861-y870-cto-decision-report.json"), JSON.stringify(ctoDecision, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y861-y870-cto-decision-report.json"), JSON.stringify({ phase: "Y861-Y870", status: "PASS_CTO_DECISION_REPORT_READY", ctoDecision, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "cto-decision-report.html"), html, "utf8");

console.log("[Y861-Y870 PASS_CTO_DECISION_REPORT_READY]");
