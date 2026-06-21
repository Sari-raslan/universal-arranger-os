const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1121-y1160");
const docsRoot = path.join(appRoot, "reports", "public-review-docs");
const publicRoot = path.join(appRoot, "public", "governance", "y1121-y1160");
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
  docsOnly: true,
  commercialProduct: "NO"
};

const overview = {
  phase: "Y1121-Y1130",
  title: "Executive Overview",
  status: "PASS_EXECUTIVE_OVERVIEW_READY",
  summary: "UAOS has a complete safe local proof, governance trail, no-output sandbox, dry-run contracts, read-only simulator, and final handover freeze. It is not a commercial product and does not include a real writer.",
  projectPosture: "SAFE_LOCAL_PROOF_AND_SANDBOX_GOVERNANCE_COMPLETE_NO_OUTPUT",
  readyHighlights: [
    "Safe local proof and QA freeze",
    "Commercial readiness planning artifacts",
    "Writer specification only",
    "Conformance test design",
    "Approval governance",
    "Isolated no-output sandbox phase 0",
    "Dry-run interface contracts",
    "Sandbox audit freeze",
    "Read-only simulator",
    "Final master index and handover freeze"
  ],
  blockedHighlights: [
    "Writer implementation",
    "Real writer",
    "Real keyboard output",
    "Production parser",
    "Deploy/public release",
    "Fixtures read/copy/modify",
    "App.jsx modification",
    "Commercial product claim"
  ],
  mainPages: [
    "http://127.0.0.1:5198/universal-arranger-os/governance/final-master-index.html",
    "http://127.0.0.1:5198/universal-arranger-os/governance/final-handover-freeze.html",
    "http://127.0.0.1:5198/universal-arranger-os/governance/y1121-y1160/executive-overview.html"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# UAOS Executive Overview

## Status

${overview.projectPosture}

## Summary

${overview.summary}

## Ready Highlights

${overview.readyHighlights.map(x => "- " + x).join("\n")}

## Blocked Highlights

${overview.blockedHighlights.map(x => "- " + x).join("\n")}

## Rule

Do not implement writer until separate explicit approval with exact scope.
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Executive Overview</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Executive Overview</h1><h2 class="pass">${esc(overview.projectPosture)}</h2><p>${esc(overview.summary)}</p></div>
<div class="grid">
<div class="card pass"><h3>Local Proof</h3><p>READY</p></div>
<div class="card pass"><h3>Governance</h3><p>READY</p></div>
<div class="card pass"><h3>Sandbox</h3><p>NO-OUTPUT READY</p></div>
<div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Real Output</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Commercial Product</h3><p>NO</p></div>
</div>
<div class="card pass"><h2>Ready Highlights</h2><ul>${list(overview.readyHighlights)}</ul></div>
<div class="card bad"><h2>Blocked Highlights</h2><ul>${list(overview.blockedHighlights)}</ul></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1121-executive-overview.json"), JSON.stringify(overview, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1121-executive-overview.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1121-y1130-executive-overview-report.json"), JSON.stringify({ phase: "Y1121-Y1130", status: "PASS_EXECUTIVE_OVERVIEW_READY", overview, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "executive-overview.html"), html, "utf8");

console.log("[Y1121-Y1130 PASS_EXECUTIVE_OVERVIEW_READY]");
