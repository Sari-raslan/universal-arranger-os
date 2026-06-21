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

const decisions = {
  phase: "Y1201-Y1210",
  title: "Approval Decision Pages",
  status: "PASS_APPROVAL_DECISION_PAGES_READY",
  currentDecision: "NO_DECISION_SELECTED",
  noFurtherCodeGate: "ACTIVE",
  allowedDecisionTypes: [
    {
      id: "DECISION-DOCS-UI",
      title: "Continue Docs/UI only",
      approvalLevel: "LOW_RISK",
      writerAllowed: false,
      outputAllowed: false,
      parserAllowed: false,
      deployAllowed: false,
      fixturesAllowed: false,
      description: "Continue improving documentation and review UI only."
    },
    {
      id: "DECISION-NO-OUTPUT-PROTOTYPE",
      title: "Approve limited no-output prototype planning",
      approvalLevel: "MEDIUM_RISK",
      writerAllowed: false,
      outputAllowed: false,
      parserAllowed: false,
      deployAllowed: false,
      fixturesAllowed: false,
      description: "Allow a future planning prototype that still produces no real output."
    },
    {
      id: "DECISION-DEFER-WRITER",
      title: "Defer writer work",
      approvalLevel: "LOW_RISK",
      writerAllowed: false,
      outputAllowed: false,
      parserAllowed: false,
      deployAllowed: false,
      fixturesAllowed: false,
      description: "Keep all writer and output work blocked."
    }
  ],
  notApprovedHere: [
    "writer implementation",
    "real writer",
    "real keyboard output",
    ".STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify",
    "App.jsx modification"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# Approval Decision Pages

## Current Decision

NO_DECISION_SELECTED

## No-Further-Code Gate

ACTIVE

## Allowed Decision Types

${decisions.allowedDecisionTypes.map(x => `- ${x.id}: ${x.title} — ${x.description}`).join("\n")}

## Not Approved Here

${decisions.notApprovedHere.map(x => "- " + x).join("\n")}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = decisions.allowedDecisionTypes.map(x => `
<tr>
<td>${esc(x.id)}</td>
<td>${esc(x.title)}</td>
<td>${esc(x.approvalLevel)}</td>
<td>${x.writerAllowed ? "YES" : "NO"}</td>
<td>${x.outputAllowed ? "YES" : "NO"}</td>
<td>${esc(x.description)}</td>
</tr>`).join("\n");

const blocked = decisions.notApprovedHere.map(x => `<li>${esc(x)}</li>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Approval Decision Pages</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px;vertical-align:top}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Approval Decision Pages</h1><h2 class="lock">No-Further-Code Gate: ACTIVE</h2><p>Current decision: NO_DECISION_SELECTED</p></div>
<div class="card"><h2>Allowed Decision Types</h2><table><tr><th>ID</th><th>Title</th><th>Level</th><th>Writer?</th><th>Output?</th><th>Description</th></tr>${rows}</table></div>
<div class="card bad"><h2>Not Approved Here</h2><ul>${blocked}</ul></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1201-approval-decision-pages.json"), JSON.stringify(decisions, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1201-approval-decision-pages.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1201-y1210-approval-decision-pages-report.json"), JSON.stringify({ phase: "Y1201-Y1210", status: "PASS_APPROVAL_DECISION_PAGES_READY", decisions, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "approval-decision-pages.html"), html, "utf8");

console.log("[Y1201-Y1210 PASS_APPROVAL_DECISION_PAGES_READY]");
