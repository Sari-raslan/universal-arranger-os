const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "writer-approval");
const reportsRoot = path.join(appRoot, "reports", "writer-approval");
const publicRoot = path.join(appRoot, "public", "governance", "y821-y860");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y831-y840");

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

const riskMatrix = {
  phase: "Y831-Y836",
  title: "Writer Sandbox Risk Matrix",
  status: "PASS_RISK_MATRIX_READY",
  risks: [
    { id: "RISK-001", risk: "Accidental writer implementation", severity: "CRITICAL", likelihood: "MEDIUM", mitigation: "Gate fails if implementation files or output logic appear.", currentState: "BLOCKED" },
    { id: "RISK-002", risk: "Real keyboard output generation", severity: "CRITICAL", likelihood: "MEDIUM", mitigation: "Forbidden extension scan and no-output rule.", currentState: "BLOCKED" },
    { id: "RISK-003", risk: "Production parser bridge", severity: "CRITICAL", likelihood: "LOW", mitigation: "Parser integration remains blocked.", currentState: "BLOCKED" },
    { id: "RISK-004", risk: "Fixture read/copy/modify", severity: "CRITICAL", likelihood: "LOW", mitigation: "Fixture isolation rule.", currentState: "BLOCKED" },
    { id: "RISK-005", risk: "Deploy/public release", severity: "CRITICAL", likelihood: "LOW", mitigation: "No deploy commands, local reports only.", currentState: "BLOCKED" },
    { id: "RISK-006", risk: "False commercial readiness claim", severity: "HIGH", likelihood: "MEDIUM", mitigation: "Public claim rules and commercial readiness gate.", currentState: "BLOCKED" }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const goNoGo = {
  phase: "Y837-Y840",
  title: "Go / No-Go Gate",
  status: "PASS_GO_NO_GO_GATE_READY",
  decisionNow: "NO_GO",
  goConditionsFutureOnly: [
    "Manual approval text accepted.",
    "Risk matrix all critical risks mitigated.",
    "Conformance test design approved.",
    "Sandbox path approved.",
    "Rollback/freeze policy approved.",
    "No-output policy remains active unless separately changed."
  ],
  noGoReasonsNow: [
    "Writer implementation not approved.",
    "Real keyboard output not approved.",
    "Production parser not approved.",
    "Deploy/public release not approved.",
    "Fixtures read/copy/modify not approved."
  ],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const riskRows = riskMatrix.risks.map(x => `
<tr>
  <td>${esc(x.id)}</td>
  <td>${esc(x.risk)}</td>
  <td>${esc(x.severity)}</td>
  <td>${esc(x.likelihood)}</td>
  <td>${esc(x.mitigation)}</td>
  <td>${esc(x.currentState)}</td>
</tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Writer Sandbox Risk Matrix</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px;vertical-align:top}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card">
    <h1>UAOS Writer Sandbox Risk Matrix + Go/No-Go</h1>
    <h2 class="bad">Decision Now: NO-GO</h2>
  </div>
  <div class="card">
    <h2>Risk Matrix</h2>
    <table><tr><th>ID</th><th>Risk</th><th>Severity</th><th>Likelihood</th><th>Mitigation</th><th>Current State</th></tr>${riskRows}</table>
  </div>
  <div class="card bad">
    <h2>No-Go Reasons Now</h2>
    <ul>${list(goNoGo.noGoReasonsNow)}</ul>
  </div>
  <div class="card pass">
    <h2>Future Go Conditions</h2>
    <ul>${list(goNoGo.goConditionsFutureOnly)}</ul>
  </div>
  <div class="card lock">
    <p>Writer implementation: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED</p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y831-risk-matrix.json"), JSON.stringify(riskMatrix, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y837-go-no-go-gate.json"), JSON.stringify(goNoGo, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y831-y840-risk-matrix-go-no-go.json"), JSON.stringify({ riskMatrix, goNoGo, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y831-y840-risk-matrix-go-no-go-report.json"), JSON.stringify({ phase: "Y831-Y840", status: "PASS_RISK_MATRIX_GO_NO_GO_READY", riskMatrix, goNoGo, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "risk-matrix-go-no-go.html"), html, "utf8");

console.log("[Y831-Y840 PASS_RISK_MATRIX_GO_NO_GO_READY]");
