const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1241-y1280");
const docsRoot = path.join(appRoot, "reports", "official-path-selection");
const publicRoot = path.join(appRoot, "public", "governance", "y1241-y1280");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });

const safety = {
  selectedPath: "PATH-DOCS-UI",
  pathLocked: true,
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

const selection = {
  phase: "Y1241-Y1250",
  title: "Official Docs/UI Path Selection Record",
  status: "PASS_OFFICIAL_DOCS_UI_PATH_SELECTED",
  selectedPath: "PATH-DOCS-UI",
  selectedPathTitle: "Docs/UI only",
  approvalText: "User approved PATH-DOCS-UI. Docs/UI only. No writer implementation, no real writer, no real keyboard output, no production parser, no deploy, no App.jsx, no fixtures read/copy/modify, no operational code.",
  allowedNow: [
    "documentation pages",
    "review UI pages",
    "status reports",
    "governance summaries",
    "README/review presentation docs"
  ],
  blockedNow: [
    "writer implementation",
    "real writer",
    "real keyboard output",
    ".STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output",
    "production parser",
    "deploy/public release",
    "fixtures read/copy/modify",
    "App.jsx modification",
    "operational code"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# Official Path Selection

## Selected Path

PATH-DOCS-UI

## Meaning

Docs/UI only.

## Allowed

${selection.allowedNow.map(x => "- " + x).join("\n")}

## Blocked

${selection.blockedNow.map(x => "- " + x).join("\n")}

## Approval Text

${selection.approvalText}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Official Docs/UI Path Selection</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Official Path Selection</h1><h2 class="pass">PATH-DOCS-UI SELECTED</h2><p>Docs/UI only. No operational code.</p></div>
<div class="card pass"><h2>Allowed Now</h2><ul>${list(selection.allowedNow)}</ul></div>
<div class="card bad"><h2>Blocked Now</h2><ul>${list(selection.blockedNow)}</ul></div>
<div class="card lock"><h2>Approval Text</h2><p>${esc(selection.approvalText)}</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1241-official-docs-ui-selection.json"), JSON.stringify(selection, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1241-official-docs-ui-selection.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1241-y1250-official-docs-ui-selection-report.json"), JSON.stringify({ phase: "Y1241-Y1250", status: "PASS_OFFICIAL_DOCS_UI_PATH_SELECTED", selection, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "official-docs-ui-selection.html"), html, "utf8");

console.log("[Y1241-Y1250 PASS_OFFICIAL_DOCS_UI_PATH_SELECTED]");
