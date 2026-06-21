const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const repoRoot = path.dirname(appRoot);
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1161-y1200");
const docsRoot = path.join(appRoot, "reports", "repository-presentation");
const publicRoot = path.join(appRoot, "public", "governance", "y1161-y1200");

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
  docsOnly: true,
  commercialProduct: "NO"
};

const readme = `# UAOS — Universal Arranger OS

## Current Status

UAOS is currently a **safe local proof and governance-ready sandbox review package**.

It is **not** a commercial product yet.

## Ready

- Safe local proof and QA freeze
- Commercial readiness planning artifacts
- Writer specification only
- Conformance test design
- Approval governance
- Isolated no-output sandbox phase 0
- Dry-run interface contracts
- Sandbox audit freeze
- Read-only simulator and forbidden-action rejection proof
- Final master index and handover freeze
- Public review documentation pack

## Blocked

- Writer implementation
- Real writer
- Real keyboard output
- .STY / .SET / .PRS / .STL / .PAT / .MSP / .KST generation
- Production parser
- Deploy/public release
- Fixtures read/copy/modify
- App.jsx modification
- Commercial product claims

## Local Review Pages

Start here:

\`\`\`text
http://127.0.0.1:5198/universal-arranger-os/governance/final-master-index.html
\`\`\`

Public review pack:

\`\`\`text
http://127.0.0.1:5198/universal-arranger-os/governance/y1121-y1160/public-review-index.html
\`\`\`

## Rule

Do not implement the writer until there is a separate explicit approval with exact scope, safety gates, rollback policy, and no-output / output approval boundaries.
`;

const report = {
  phase: "Y1161-Y1170",
  title: "Repository README Safe Presentation",
  status: "PASS_REPOSITORY_README_PRESENTATION_READY",
  createdFiles: [
    "README_SAFE_REVIEW.md",
    "reports/repository-presentation/Y1161-repository-readme-summary.json"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Repository README Presentation</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
pre{white-space:pre-wrap;background:#111;padding:18px;border-radius:12px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Repository README Presentation</h1><h2 class="pass">SAFE REVIEW README READY</h2></div>
<div class="card"><pre>${esc(readme)}</pre></div>
<div class="card lock"><h2>Locks</h2><p>Writer: BLOCKED | Real output: BLOCKED | Parser: BLOCKED | Deploy: BLOCKED | Fixtures: BLOCKED | App.jsx: false</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(appRoot, "README_SAFE_REVIEW.md"), readme, "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1161-repository-readme-summary.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1161-y1170-repository-readme-report.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "repository-readme.html"), html, "utf8");

console.log("[Y1161-Y1170 PASS_REPOSITORY_README_PRESENTATION_READY]");
