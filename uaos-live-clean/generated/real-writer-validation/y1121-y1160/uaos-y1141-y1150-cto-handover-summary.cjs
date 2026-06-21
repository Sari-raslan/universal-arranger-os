const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1121-y1160");
const docsRoot = path.join(appRoot, "reports", "public-review-docs");
const publicRoot = path.join(appRoot, "public", "governance", "y1121-y1160");

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

const handover = {
  phase: "Y1141-Y1150",
  title: "CTO Handover Summary",
  status: "PASS_CTO_HANDOVER_SUMMARY_READY",
  oneLine: "UAOS is a safe local proof and governance-ready sandbox review package; it is not a commercial product and contains no real writer/output implementation.",
  technicalPosture: [
    "Safe local proof and generated governance reports exist.",
    "No-output sandbox exists under generated only.",
    "Dry-run interface contracts exist as JSON/HTML/MD only.",
    "Read-only simulator rejects forbidden actions.",
    "Final handover freeze and master index exist."
  ],
  decisionNeededBeforeNextEngineering: [
    "Choose whether future work remains docs/UI only.",
    "Or explicitly approve a separate narrow sandbox phase.",
    "Do not authorize real output without conformance, hardware validation, and legal/product review."
  ],
  redLines: [
    "No writer implementation without separate approval.",
    "No keyboard file output.",
    "No production parser.",
    "No deploy/public release.",
    "No fixtures touch.",
    "No App.jsx modification."
  ],
  recommendedNextSafeOptions: [
    "Review UI polish only",
    "Documentation refinement only",
    "Architecture design only",
    "Separate approval for a limited no-output prototype only"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# CTO Handover Summary

${handover.oneLine}

## Technical Posture

${handover.technicalPosture.map(x => "- " + x).join("\n")}

## Decision Needed Before Next Engineering

${handover.decisionNeededBeforeNextEngineering.map(x => "- " + x).join("\n")}

## Red Lines

${handover.redLines.map(x => "- " + x).join("\n")}

## Recommended Next Safe Options

${handover.recommendedNextSafeOptions.map(x => "- " + x).join("\n")}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS CTO Handover Summary</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
</style>
</head>
<body>
<div class="card"><h1>UAOS CTO Handover Summary</h1><h2>${esc(handover.oneLine)}</h2></div>
<div class="card pass"><h2>Technical Posture</h2><ul>${list(handover.technicalPosture)}</ul></div>
<div class="card lock"><h2>Decision Needed Before Next Engineering</h2><ul>${list(handover.decisionNeededBeforeNextEngineering)}</ul></div>
<div class="card bad"><h2>Red Lines</h2><ul>${list(handover.redLines)}</ul></div>
<div class="card pass"><h2>Recommended Next Safe Options</h2><ul>${list(handover.recommendedNextSafeOptions)}</ul></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1141-cto-handover-summary.json"), JSON.stringify(handover, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1141-cto-handover-summary.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1141-y1150-cto-handover-summary-report.json"), JSON.stringify({ phase: "Y1141-Y1150", status: "PASS_CTO_HANDOVER_SUMMARY_READY", handover, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "cto-handover-summary.html"), html, "utf8");

console.log("[Y1141-Y1150 PASS_CTO_HANDOVER_SUMMARY_READY]");
