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

const rules = {
  phase: "Y1251-Y1260",
  title: "Docs/UI Path Working Rules",
  status: "PASS_DOCS_UI_WORKING_RULES_READY",
  path: "PATH-DOCS-UI",
  allowedFileTypes: [".html", ".json", ".md", ".txt"],
  allowedWork: [
    "review page polish",
    "documentation refinement",
    "status explanation",
    "governance index improvement",
    "handover clarity",
    "non-operational reports"
  ],
  forbiddenWork: [
    "runtime features",
    "writer implementation",
    "binary exporters",
    "keyboard output",
    "production parsers",
    "deployment scripts",
    "fixture access",
    "App.jsx edits"
  ],
  stopConditions: [
    "Any request to create real output",
    "Any request to implement writer",
    "Any request to touch fixtures",
    "Any request to deploy",
    "Any request to modify App.jsx",
    "Any request to introduce operational code"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# Docs/UI Path Working Rules

## Path

PATH-DOCS-UI

## Allowed File Types

${rules.allowedFileTypes.map(x => "- " + x).join("\n")}

## Allowed Work

${rules.allowedWork.map(x => "- " + x).join("\n")}

## Forbidden Work

${rules.forbiddenWork.map(x => "- " + x).join("\n")}

## Stop Conditions

${rules.stopConditions.map(x => "- " + x).join("\n")}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Docs/UI Working Rules</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
</style>
</head>
<body>
<div class="card"><h1>UAOS Docs/UI Working Rules</h1><h2 class="pass">PATH-DOCS-UI LOCKED</h2></div>
<div class="card pass"><h2>Allowed Work</h2><ul>${list(rules.allowedWork)}</ul></div>
<div class="card bad"><h2>Forbidden Work</h2><ul>${list(rules.forbiddenWork)}</ul></div>
<div class="card lock"><h2>Stop Conditions</h2><ul>${list(rules.stopConditions)}</ul></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1251-docs-ui-working-rules.json"), JSON.stringify(rules, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1251-docs-ui-working-rules.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1251-y1260-docs-ui-working-rules-report.json"), JSON.stringify({ phase: "Y1251-Y1260", status: "PASS_DOCS_UI_WORKING_RULES_READY", rules, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "docs-ui-working-rules.html"), html, "utf8");

console.log("[Y1251-Y1260 PASS_DOCS_UI_WORKING_RULES_READY]");
