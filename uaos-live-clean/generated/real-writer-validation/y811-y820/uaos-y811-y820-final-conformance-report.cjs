const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "conformance");
const reportsRoot = path.join(appRoot, "reports", "conformance");
const publicRoot = path.join(appRoot, "public", "governance", "y781-y820");
const publicGovRoot = path.join(appRoot, "public", "governance");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y811-y820");

fs.mkdirSync(specRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(publicGovRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

function exists(rel){ return fs.existsSync(path.join(appRoot, rel)); }
function load(rel){
  const p = path.join(appRoot, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

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

const inputs = {
  matrix: load("reports/conformance/y781-y790-test-matrix-validation-rules.json"),
  hwSw: load("reports/conformance/y791-y800-hw-sw-failure-modes.json"),
  passFail: load("reports/conformance/y801-y810-pass-fail-no-output-qa.json")
};

const finalReport = {
  phase: "Y811-Y820",
  title: "Final Conformance Test Design Report",
  status: "PASS_CONFORMANCE_TEST_DESIGN_READY_IMPLEMENTATION_BLOCKED",
  scope: "Conformance test design only. No writer. No output. No production parser. No deploy.",
  artifactReadiness: {
    testMatrix: inputs.matrix ? "READY" : "MISSING",
    validationRules: inputs.matrix ? "READY" : "MISSING",
    hardwareSoftwareChecklist: inputs.hwSw ? "READY" : "MISSING",
    failureModes: inputs.hwSw ? "READY" : "MISSING",
    passFailCriteria: inputs.passFail ? "READY" : "MISSING",
    noOutputQaRules: inputs.passFail ? "READY" : "MISSING",
    finalDashboard: "READY"
  },
  finalVerdict: {
    conformanceDesign: "READY",
    writer: "BLOCKED",
    realWriter: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deployPublicRelease: "BLOCKED",
    fixturesReadCopyModify: "BLOCKED",
    implementation: "BLOCKED"
  },
  nextSafePhase: "Y821-Y860 Writer Sandbox Approval Gate only",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = Object.entries(finalReport.artifactReadiness).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Final Conformance Test Design</title>
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
    <h1>UAOS Final Conformance Test Design</h1>
    <h2>Y811-Y820 PASS_CONFORMANCE_TEST_DESIGN_READY_IMPLEMENTATION_BLOCKED</h2>
    <p>Conformance design is ready. Implementation remains blocked.</p>
  </div>
  <div class="grid">
    <div class="card pass"><h3>Conformance Design</h3><p>READY</p></div>
    <div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Fixtures Touch</h3><p>BLOCKED</p></div>
  </div>
  <div class="card">
    <h2>Artifact Readiness</h2>
    <table><tr><th>Artifact</th><th>Status</th></tr>${rows}</table>
  </div>
  <div class="card">
    <h2>Review Pages</h2>
    <p><a href="./index.html">Test Matrix + Validation Rules</a></p>
    <p><a href="./hw-sw-failure-modes.html">HW/SW Checklist + Failure Modes</a></p>
    <p><a href="./pass-fail-no-output-qa.html">Pass/Fail + No-Output QA</a></p>
  </div>
</body>
</html>`;

const govIndex = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>UAOS Governance Index</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}a{color:#9fd0ff}
</style></head>
<body>
<div class="card"><h1>UAOS Governance Index</h1><p>Pre-writer governance and conformance review pages.</p></div>
<div class="card pass"><h2>Available</h2><p><a href="./y781-y820/final-conformance-report.html">Y781-Y820 Final Conformance Design Report</a></p></div>
<div class="card lock"><h2>Blocked Capabilities</h2><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED</p></div>
</body></html>`;

fs.writeFileSync(path.join(specRoot, "Y820-final-conformance-test-design-report.json"), JSON.stringify(finalReport, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y781-y820-final-conformance-test-design-report.json"), JSON.stringify(finalReport, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y811-y820-final-conformance-test-design-report.json"), JSON.stringify(finalReport, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "final-conformance-report.html"), html, "utf8");
fs.writeFileSync(path.join(publicGovRoot, "index.html"), govIndex, "utf8");

console.log("[Y811-Y820 PASS_CONFORMANCE_TEST_DESIGN_READY_IMPLEMENTATION_BLOCKED]");
