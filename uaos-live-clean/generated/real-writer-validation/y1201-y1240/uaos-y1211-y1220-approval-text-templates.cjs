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

const templates = {
  phase: "Y1211-Y1220",
  title: "Approval Text Templates",
  status: "PASS_APPROVAL_TEXT_TEMPLATES_READY",
  instruction: "Copy exactly one template only if you want to approve a later separate phase. These templates do not approve writer or output by themselves.",
  templates: [
    {
      id: "TPL-DOCS-UI-ONLY",
      title: "Approve Docs/UI only",
      text: "I approve the next phase as Docs/UI only. No writer implementation, no real writer, no real keyboard output, no production parser, no deploy, no App.jsx, and no fixtures read/copy/modify."
    },
    {
      id: "TPL-NO-OUTPUT-PROTOTYPE-ONLY",
      title: "Approve no-output prototype planning only",
      text: "I approve a limited no-output prototype planning phase only. It must not implement a real writer, must not create real keyboard output, must not use production parser, must not deploy, must not touch App.jsx, and must not read/copy/modify fixtures."
    },
    {
      id: "TPL-DEFER-WRITER",
      title: "Defer writer",
      text: "I choose to defer writer work. Keep writer implementation, real writer, real keyboard output, production parser, deploy, fixtures, and App.jsx all blocked."
    }
  ],
  invalidTemplatesNotProvidedFor: [
    "real writer approval",
    "real keyboard output approval",
    "production parser approval",
    "deploy/public release approval",
    "fixtures permission"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# Approval Text Templates

${templates.instruction}

${templates.templates.map(t => `## ${t.id}\n\n${t.text}`).join("\n\n")}

## Not Provided Here

${templates.invalidTemplatesNotProvidedFor.map(x => "- " + x).join("\n")}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const blocks = templates.templates.map(t => `<div class="card"><h2>${esc(t.id)}</h2><h3>${esc(t.title)}</h3><pre>${esc(t.text)}</pre></div>`).join("\n");
const invalid = templates.invalidTemplatesNotProvidedFor.map(x => `<li>${esc(x)}</li>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Approval Text Templates</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
pre{white-space:pre-wrap;background:#111;padding:14px;border-radius:12px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
</style>
</head>
<body>
<div class="card"><h1>UAOS Approval Text Templates</h1><h2 class="lock">No-Further-Code Gate Remains ACTIVE</h2><p>${esc(templates.instruction)}</p></div>
${blocks}
<div class="card bad"><h2>Templates Not Provided For</h2><ul>${invalid}</ul></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1211-approval-text-templates.json"), JSON.stringify(templates, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1211-approval-text-templates.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1211-y1220-approval-text-templates-report.json"), JSON.stringify({ phase: "Y1211-Y1220", status: "PASS_APPROVAL_TEXT_TEMPLATES_READY", templates, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "approval-text-templates.html"), html, "utf8");

console.log("[Y1211-Y1220 PASS_APPROVAL_TEXT_TEMPLATES_READY]");
