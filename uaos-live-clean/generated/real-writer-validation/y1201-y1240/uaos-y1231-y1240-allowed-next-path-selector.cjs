const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1201-y1240");
const docsRoot = path.join(appRoot, "reports", "next-phase-approval");
const publicRoot = path.join(appRoot, "public", "governance", "y1201-y1240");
const publicGov = path.join(appRoot, "public", "governance");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(publicGov, { recursive: true });

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

const selector = {
  phase: "Y1231-Y1240",
  title: "Allowed Next Path Selector",
  status: "PASS_ALLOWED_NEXT_PATH_SELECTOR_READY",
  selectedPathNow: "NONE",
  noFurtherCodeGate: "ACTIVE",
  selectablePaths: [
    {
      id: "PATH-DOCS-UI",
      name: "Docs/UI only",
      allowedWithoutAdditionalTechnicalRisk: true,
      writerAllowed: false,
      outputAllowed: false,
      parserAllowed: false,
      deployAllowed: false,
      fixturesAllowed: false
    },
    {
      id: "PATH-NO-OUTPUT-PROTOTYPE-PLANNING",
      name: "No-output prototype planning only",
      allowedWithoutAdditionalTechnicalRisk: false,
      writerAllowed: false,
      outputAllowed: false,
      parserAllowed: false,
      deployAllowed: false,
      fixturesAllowed: false
    },
    {
      id: "PATH-DEFER-WRITER",
      name: "Defer writer",
      allowedWithoutAdditionalTechnicalRisk: true,
      writerAllowed: false,
      outputAllowed: false,
      parserAllowed: false,
      deployAllowed: false,
      fixturesAllowed: false
    }
  ],
  excludedPaths: [
    "real writer",
    "real keyboard output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify"
  ],
  nextInstruction: "Choose one path in a separate explicit message. This pack does not select a path.",
  safety,
  generatedAt: new Date().toISOString()
};

const finalPack = {
  phase: "Y1201-Y1240",
  title: "Explicit Next-Phase Approval Pack",
  status: "PASS_EXPLICIT_NEXT_PHASE_APPROVAL_PACK_READY",
  finalState: {
    approvalDecisionPages: "READY",
    approvalTextTemplates: "READY",
    riskAcceptanceChecklist: "READY",
    allowedNextPathSelector: "READY",
    selectedPathNow: "NONE",
    riskAcceptanceNow: "NOT_ACCEPTED",
    noFurtherCodeGate: "ACTIVE",
    outputAllowed: "NO",
    writerImplementation: "BLOCKED",
    realWriter: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deployPublicRelease: "BLOCKED",
    fixturesReadCopyModify: "BLOCKED",
    appJsxModified: false,
    operationalCode: "NO",
    commercialProduct: "NO"
  },
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# Allowed Next Path Selector

Selected path now: NONE

No-further-code gate: ACTIVE

## Selectable Paths

${selector.selectablePaths.map(x => `- ${x.id}: ${x.name}; writer: ${x.writerAllowed}; output: ${x.outputAllowed}`).join("\n")}

## Excluded Paths

${selector.excludedPaths.map(x => "- " + x).join("\n")}

## Next Instruction

${selector.nextInstruction}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const pathRows = selector.selectablePaths.map(x => `
<tr>
<td>${esc(x.id)}</td>
<td>${esc(x.name)}</td>
<td>${x.writerAllowed ? "YES" : "NO"}</td>
<td>${x.outputAllowed ? "YES" : "NO"}</td>
<td>${x.parserAllowed ? "YES" : "NO"}</td>
<td>${x.deployAllowed ? "YES" : "NO"}</td>
<td>${x.fixturesAllowed ? "YES" : "NO"}</td>
</tr>`).join("\n");

const excluded = selector.excludedPaths.map(x => `<li>${esc(x)}</li>`).join("\n");

const selectorHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Allowed Next Path Selector</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px;vertical-align:top}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Allowed Next Path Selector</h1><h2 class="lock">Selected Path Now: NONE</h2><p>No-further-code gate remains ACTIVE.</p></div>
<div class="card"><h2>Selectable Paths</h2><table><tr><th>ID</th><th>Name</th><th>Writer?</th><th>Output?</th><th>Parser?</th><th>Deploy?</th><th>Fixtures?</th></tr>${pathRows}</table></div>
<div class="card bad"><h2>Excluded Paths</h2><ul>${excluded}</ul></div>
<div class="card lock"><h2>Next Instruction</h2><p>${esc(selector.nextInstruction)}</p></div>
</body>
</html>`;

const indexHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Explicit Next-Phase Approval Pack</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Explicit Next-Phase Approval Pack</h1><h2 class="pass">Approval Pack Ready</h2><p>No path is selected. No operational code is created.</p></div>
<div class="grid">
<div class="card"><h3>Approval Decision Pages</h3><p><a href="./approval-decision-pages.html">Open</a></p></div>
<div class="card"><h3>Approval Text Templates</h3><p><a href="./approval-text-templates.html">Open</a></p></div>
<div class="card"><h3>Risk Acceptance Checklist</h3><p><a href="./risk-acceptance-checklist.html">Open</a></p></div>
<div class="card"><h3>Allowed Next Path Selector</h3><p><a href="./allowed-next-path-selector.html">Open</a></p></div>
<div class="card"><h3>No Further Code Gate</h3><p><a href="../y1161-y1200/no-further-code-gate.html">Open</a></p></div>
</div>
<div class="card lock"><h2>Final State</h2><p>Selected Path: NONE<br>Risk Acceptance: NOT_ACCEPTED<br>No-Further-Code Gate: ACTIVE<br>Writer: BLOCKED<br>Output: NO<br>Parser: BLOCKED<br>Deploy: BLOCKED<br>Fixtures: BLOCKED<br>App.jsx: false</p></div>
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
<div class="card"><h1>UAOS Governance Index</h1><p>Final review and approval entry point.</p></div>
<div class="card pass"><h2>Main Pages</h2>
<p><a href="./final-master-index.html">Final Master Index</a></p>
<p><a href="./y1161-y1200/final-review-hub.html">Y1161-Y1200 Final Review Hub</a></p>
<p><a href="./y1161-y1200/no-further-code-gate.html">No Further Code Gate</a></p>
<p><a href="./y1201-y1240/explicit-next-phase-approval-pack.html">Y1201-Y1240 Explicit Next-Phase Approval Pack</a></p>
</div>
<div class="card lock"><h2>Gate</h2><p>NO FURTHER CODE WITHOUT EXPLICIT APPROVAL</p></div>
</body></html>`;

fs.writeFileSync(path.join(docsRoot, "Y1231-allowed-next-path-selector.json"), JSON.stringify(selector, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1231-allowed-next-path-selector.md"), md, "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1240-explicit-next-phase-approval-pack-final.json"), JSON.stringify(finalPack, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1231-y1240-allowed-next-path-selector-report.json"), JSON.stringify({ phase: "Y1231-Y1240", status: "PASS_ALLOWED_NEXT_PATH_SELECTOR_READY", selector, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1201-y1240-final-explicit-next-phase-approval-pack-report.json"), JSON.stringify({ phase: "Y1201-Y1240", status: "PASS_EXPLICIT_NEXT_PHASE_APPROVAL_PACK_READY", finalPack, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "allowed-next-path-selector.html"), selectorHtml, "utf8");
fs.writeFileSync(path.join(publicRoot, "explicit-next-phase-approval-pack.html"), indexHtml, "utf8");
fs.writeFileSync(path.join(publicGov, "explicit-next-phase-approval-pack.html"), indexHtml, "utf8");
fs.writeFileSync(path.join(publicGov, "index.html"), govIndex, "utf8");

console.log("[Y1231-Y1240 PASS_ALLOWED_NEXT_PATH_SELECTOR_READY]");
console.log("[Y1201-Y1240 PASS_EXPLICIT_NEXT_PHASE_APPROVAL_PACK_READY]");
