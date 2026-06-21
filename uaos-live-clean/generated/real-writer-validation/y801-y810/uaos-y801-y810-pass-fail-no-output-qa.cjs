const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "conformance");
const reportsRoot = path.join(appRoot, "reports", "conformance");
const publicRoot = path.join(appRoot, "public", "governance", "y781-y820");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y801-y810");

fs.mkdirSync(specRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const safety = {
  writer: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  designOnly: true,
  noOutputQa: true
};

const passFailCriteria = {
  phase: "Y801-Y805",
  title: "Pass / Fail Criteria Design",
  status: "PASS_CRITERIA_DESIGN_READY",
  passCriteria: [
    "All reports are valid JSON.",
    "All public review pages exist.",
    "All safety fields explicitly block writer, output, parser, deploy, fixtures, and App.jsx changes.",
    "No forbidden keyboard output extensions are created.",
    "No code path implements writer behavior.",
    "No fixture path is read/copied/modified.",
    "Build passes after every group."
  ],
  failCriteria: [
    "Any writer implementation appears.",
    "Any real keyboard output file appears.",
    "Any forbidden extension file appears.",
    "Any production parser bridge appears.",
    "Any deploy/public release command appears.",
    "Any fixture interaction appears.",
    "Any App.jsx modification appears.",
    "Any safety field is missing or not blocked."
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const noOutputQaRules = {
  phase: "Y806-Y810",
  title: "No-Output QA Rules",
  status: "PASS_NO_OUTPUT_QA_RULES_READY",
  noOutputRules: [
    { id: "NOOUT-001", rule: "No output files with keyboard extensions may be created." },
    { id: "NOOUT-002", rule: "Reports may describe future output contracts only." },
    { id: "NOOUT-003", rule: "HTML may display forbidden extensions only as blocked formats." },
    { id: "NOOUT-004", rule: "No binary serialization logic may exist." },
    { id: "NOOUT-005", rule: "No writer adapter implementation may exist." },
    { id: "NOOUT-006", rule: "No fixture content may be read to validate output." },
    { id: "NOOUT-007", rule: "No production parser may be called." }
  ],
  allowedArtifacts: [
    ".json",
    ".md",
    ".html",
    ".txt"
  ],
  forbiddenKeyboardExtensions: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}
const qaRows = noOutputQaRules.noOutputRules.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.rule)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Pass/Fail + No-Output QA</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px;vertical-align:top}
    .pass{color:#80ffb0}.bad{color:#ff8080}.lock{color:#ffcc66}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card"><h1>UAOS Pass/Fail + No-Output QA Rules</h1><p>Design only. No output allowed.</p></div>
  <div class="card pass"><h2>Pass Criteria</h2><ul>${list(passFailCriteria.passCriteria)}</ul></div>
  <div class="card bad"><h2>Fail Criteria</h2><ul>${list(passFailCriteria.failCriteria)}</ul></div>
  <div class="card"><h2>No-Output QA Rules</h2><table><tr><th>ID</th><th>Rule</th></tr>${qaRows}</table></div>
  <div class="card lock"><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED | App.jsx: NOT MODIFIED</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y801-pass-fail-criteria.json"), JSON.stringify(passFailCriteria, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y806-no-output-qa-rules.json"), JSON.stringify(noOutputQaRules, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y801-y810-pass-fail-no-output-qa.json"), JSON.stringify({ passFailCriteria, noOutputQaRules, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y801-y810-pass-fail-no-output-qa-report.json"), JSON.stringify({ phase: "Y801-Y810", status: "PASS_PASS_FAIL_NO_OUTPUT_QA_READY", passFailCriteria, noOutputQaRules, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "pass-fail-no-output-qa.html"), html, "utf8");

console.log("[Y801-Y810 PASS_PASS_FAIL_NO_OUTPUT_QA_READY]");
