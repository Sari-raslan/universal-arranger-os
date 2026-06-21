const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1201-y1240");
const docsRoot = path.join(appRoot, "reports", "next-phase-approval");
const publicRoot = path.join(appRoot, "public", "governance", "y1201-y1240");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  forbiddenKeyboardExtensions: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  outputAllowed: false,
  operationalCode: "NO",
  docsOnly: true,
  noFurtherCodeGate: "ACTIVE",
  commercialProduct: "NO"
};

const checklist = {
  phase: "Y1221-Y1230",
  title: "Risk Acceptance Checklist",
  status: "PASS_RISK_ACCEPTANCE_CHECKLIST_READY",
  currentRiskAcceptance: "NOT_ACCEPTED",
  checklist: [
    { id: "RISK-ACCEPT-001", item: "Confirm current phase creates approval docs only", required: true, current: "CONFIRMED" },
    { id: "RISK-ACCEPT-002", item: "Confirm no writer is approved here", required: true, current: "CONFIRMED_BLOCKED" },
    { id: "RISK-ACCEPT-003", item: "Confirm no real keyboard output is approved here", required: true, current: "CONFIRMED_BLOCKED" },
    { id: "RISK-ACCEPT-004", item: "Confirm no production parser is approved here", required: true, current: "CONFIRMED_BLOCKED" },
    { id: "RISK-ACCEPT-005", item: "Confirm no deploy/public release is approved here", required: true, current: "CONFIRMED_BLOCKED" },
    { id: "RISK-ACCEPT-006", item: "Confirm no fixtures read/copy/modify is approved here", required: true, current: "CONFIRMED_BLOCKED" },
    { id: "RISK-ACCEPT-007", item: "Confirm no App.jsx change is approved here", required: true, current: "CONFIRMED_BLOCKED" },
    { id: "RISK-ACCEPT-008", item: "Accept risk only for chosen next path in a future separate message", required: true, current: "NOT_ACCEPTED" }
  ],
  riskLevels: [
    { path: "Docs/UI only", risk: "LOW", acceptedNow: false },
    { path: "No-output prototype planning", risk: "MEDIUM", acceptedNow: false },
    { path: "Real writer", risk: "HIGH/CRITICAL", acceptedNow: false },
    { path: "Real output", risk: "CRITICAL", acceptedNow: false }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# Risk Acceptance Checklist

Current risk acceptance: NOT_ACCEPTED

${checklist.checklist.map(x => `- [ ] ${x.id}: ${x.item} — ${x.current}`).join("\n")}

## Risk Levels

${checklist.riskLevels.map(x => `- ${x.path}: ${x.risk}; accepted now: ${x.acceptedNow}`).join("\n")}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = checklist.checklist.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.item)}</td><td>${esc(x.current)}</td></tr>`).join("\n");
const riskRows = checklist.riskLevels.map(x => `<tr><td>${esc(x.path)}</td><td>${esc(x.risk)}</td><td>${x.acceptedNow ? "YES" : "NO"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Risk Acceptance Checklist</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
</style>
</head>
<body>
<div class="card"><h1>UAOS Risk Acceptance Checklist</h1><h2 class="lock">Current Risk Acceptance: NOT_ACCEPTED</h2></div>
<div class="card"><h2>Checklist</h2><table><tr><th>ID</th><th>Item</th><th>Current</th></tr>${rows}</table></div>
<div class="card"><h2>Risk Levels</h2><table><tr><th>Path</th><th>Risk</th><th>Accepted Now</th></tr>${riskRows}</table></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1221-risk-acceptance-checklist.json"), JSON.stringify(checklist, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1221-risk-acceptance-checklist.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1221-y1230-risk-acceptance-checklist-report.json"), JSON.stringify({ phase: "Y1221-Y1230", status: "PASS_RISK_ACCEPTANCE_CHECKLIST_READY", checklist, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "risk-acceptance-checklist.html"), html, "utf8");

console.log("[Y1221-Y1230 PASS_RISK_ACCEPTANCE_CHECKLIST_READY]");
