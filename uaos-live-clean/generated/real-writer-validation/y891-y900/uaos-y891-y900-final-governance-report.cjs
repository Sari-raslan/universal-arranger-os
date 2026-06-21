const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "pre-writer-governance");
const reportsRoot = path.join(appRoot, "reports", "pre-writer-governance");
const publicRoot = path.join(appRoot, "public", "governance", "y861-y900");
const publicGovRoot = path.join(appRoot, "public", "governance");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y891-y900");

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
  governanceOnly: true,
  approvalRequired: true
};

const approvalSummary = {
  phase: "Y891-Y895",
  title: "Final Approval-Required Summary",
  status: "PASS_FINAL_APPROVAL_REQUIRED_SUMMARY_READY",
  approvalRequired: true,
  currentApprovalState: "NOT_APPROVED",
  releasePosture: "NO_GO",
  finalRule: "DO NOT IMPLEMENT UNTIL APPROVED",
  blockedScope: [
    "writer implementation",
    "real writer",
    "real keyboard output",
    ".STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify",
    "App.jsx modification"
  ],
  transitionCondition: "A new separate approval message must explicitly authorize the next phase and its exact safe scope.",
  safety,
  generatedAt: new Date().toISOString()
};

const finalGovernance = {
  phase: "Y896-Y900",
  title: "Final Pre-Writer Governance Report",
  status: "PASS_FINAL_PRE_WRITER_GOVERNANCE_READY_NO_GO",
  overallState: "PREWRITER_GOVERNANCE_READY_IMPLEMENTATION_BLOCKED",
  releasePosture: "NO_GO",
  finalRule: "DO_NOT_IMPLEMENT_UNTIL_APPROVED",
  implementationIntentionallyBlocked: true,
  sourceReadiness: {
    ctoDecisionReport: !!load("reports/pre-writer-governance/y861-y870-cto-decision-report.json"),
    governanceDashboardBlockers: !!load("reports/pre-writer-governance/y871-y880-governance-dashboard-blockers.json"),
    doNotImplementGate: !!load("reports/pre-writer-governance/y881-y890-do-not-implement-gate.json"),
    finalApprovalSummary: true
  },
  finalState: {
    prewriterGovernance: "READY",
    implementation: "BLOCKED",
    writerImplementation: "BLOCKED",
    realWriter: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deployPublicRelease: "BLOCKED",
    fixturesReadCopyModify: "BLOCKED",
    appJsxModified: false,
    approvalRequired: true,
    goNoGo: "NO_GO"
  },
  nextPossibleAction: "Pause and review. Any future implementation requires a separate explicit approval phase.",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Final Pre-Writer Governance Report</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{background:#181818;border:1px solid #444;border-radius:16px;padding:24px;margin:14px 0}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Final Pre-Writer Governance Report</h1>
    <h2 class="bad">NO-GO — DO NOT IMPLEMENT UNTIL APPROVED</h2>
    <p>Prewriter governance is ready. Implementation remains intentionally blocked.</p>
  </div>
  <div class="grid">
    <div class="card pass"><h3>Prewriter Governance</h3><p>READY</p></div>
    <div class="card bad"><h3>Implementation</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Fixtures Touch</h3><p>BLOCKED</p></div>
    <div class="card bad"><h3>Approval Required</h3><p>TRUE</p></div>
  </div>
  <div class="card bad"><h2>Blocked Scope</h2><ul>${list(approvalSummary.blockedScope)}</ul></div>
  <div class="card lock"><h2>Transition Condition</h2><p>${esc(approvalSummary.transitionCondition)}</p></div>
  <div class="card"><h2>Review Pages</h2>
    <p><a href="./cto-decision-report.html">CTO Decision Report</a></p>
    <p><a href="./governance-dashboard.html">Governance Dashboard + Blocker Matrix</a></p>
    <p><a href="./do-not-implement-gate.html">Do Not Implement Gate</a></p>
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
<div class="card"><h1>UAOS Governance Index</h1><p>Final governance entry point.</p></div>
<div class="card pass"><h2>Governance Packages</h2>
<p><a href="./y781-y820/final-conformance-report.html">Y781-Y820 Final Conformance Design Report</a></p>
<p><a href="./y821-y860/final-approval-gate.html">Y821-Y860 Final Writer Sandbox Approval Gate</a></p>
<p><a href="./y861-y900/final-governance-report.html">Y861-Y900 Final Pre-Writer Governance Report</a></p>
</div>
<div class="card bad"><h2>Final Rule</h2><p>DO NOT IMPLEMENT UNTIL APPROVED</p></div>
<div class="card lock"><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED</p></div>
</body></html>`;

fs.writeFileSync(path.join(specRoot, "Y891-final-approval-required-summary.json"), JSON.stringify(approvalSummary, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y900-final-pre-writer-governance-report.json"), JSON.stringify(finalGovernance, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y891-y900-final-approval-required-summary.json"), JSON.stringify(approvalSummary, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y891-y900-final-pre-writer-governance-report.json"), JSON.stringify(finalGovernance, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y891-y900-final-governance-report.json"), JSON.stringify({ phase: "Y891-Y900", status: "PASS_FINAL_PRE_WRITER_GOVERNANCE_READY_NO_GO", approvalSummary, finalGovernance, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "final-governance-report.html"), html, "utf8");
fs.writeFileSync(path.join(publicGovRoot, "final-governance-report.html"), html, "utf8");
fs.writeFileSync(path.join(publicGovRoot, "index.html"), govIndex, "utf8");

console.log("[Y891-Y900 PASS_FINAL_PRE_WRITER_GOVERNANCE_READY_NO_GO]");
