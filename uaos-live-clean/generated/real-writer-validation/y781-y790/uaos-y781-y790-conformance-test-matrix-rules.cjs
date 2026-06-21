const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "conformance");
const reportsRoot = path.join(appRoot, "reports", "conformance");
const publicRoot = path.join(appRoot, "public", "governance", "y781-y820");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y781-y790");

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

const testMatrix = {
  phase: "Y781-Y790",
  title: "Conformance Test Matrix Design",
  status: "PASS_TEST_MATRIX_DESIGN_READY",
  designOnly: true,
  matrix: [
    {
      id: "CONF-001",
      area: "Input contract",
      objective: "Future writer input must match approved contract before any sandbox writer is allowed.",
      expectedEvidence: "JSON schema validation report only",
      passCondition: "All required fields are present in simulated plan",
      outputAllowed: false
    },
    {
      id: "CONF-002",
      area: "Output contract",
      objective: "Future output contract must be checked without producing real keyboard files.",
      expectedEvidence: "No-output validation report only",
      passCondition: "Output plan describes target metadata without creating output",
      outputAllowed: false
    },
    {
      id: "CONF-003",
      area: "Forbidden extension policy",
      objective: "No generated artifact may use forbidden keyboard extensions.",
      expectedEvidence: "File extension scan report",
      passCondition: "No .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST files exist in generated package",
      outputAllowed: false
    },
    {
      id: "CONF-004",
      area: "Fixture isolation",
      objective: "No fixture read/copy/modify is allowed.",
      expectedEvidence: "No fixture path interaction report",
      passCondition: "No fixture paths referenced or touched",
      outputAllowed: false
    },
    {
      id: "CONF-005",
      area: "Production parser isolation",
      objective: "No production parser integration is allowed.",
      expectedEvidence: "Parser integration blocker report",
      passCondition: "Production parser remains blocked",
      outputAllowed: false
    },
    {
      id: "CONF-006",
      area: "Deploy isolation",
      objective: "No deploy or public release action is allowed.",
      expectedEvidence: "Deploy blocker report",
      passCondition: "Deploy/public release remains blocked",
      outputAllowed: false
    }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const validationRules = {
  phase: "Y786-Y790",
  title: "Expected Validation Rules Design",
  status: "PASS_VALIDATION_RULES_DESIGN_READY",
  rules: [
    { id: "RULE-001", name: "Spec only", expectation: "Only JSON, MD, HTML reports allowed." },
    { id: "RULE-002", name: "No writer implementation", expectation: "No writer runtime, adapter, binary serializer, or export command." },
    { id: "RULE-003", name: "No real output", expectation: "No real keyboard file generation." },
    { id: "RULE-004", name: "No forbidden extensions", expectation: "No files ending with forbidden keyboard extensions." },
    { id: "RULE-005", name: "No fixture touch", expectation: "No fixture read/copy/modify paths." },
    { id: "RULE-006", name: "No production parser", expectation: "No parser production path or parser writer bridge." },
    { id: "RULE-007", name: "No deploy", expectation: "No deploy/public release command." },
    { id: "RULE-008", name: "No App.jsx", expectation: "No App.jsx modification." }
  ],
  forbiddenExtensions: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}

const matrixRows = testMatrix.matrix.map(x => `
<tr>
  <td>${esc(x.id)}</td>
  <td>${esc(x.area)}</td>
  <td>${esc(x.objective)}</td>
  <td>${esc(x.passCondition)}</td>
  <td>${x.outputAllowed ? "YES" : "NO"}</td>
</tr>`).join("\n");

const ruleRows = validationRules.rules.map(x => `
<tr>
  <td>${esc(x.id)}</td>
  <td>${esc(x.name)}</td>
  <td>${esc(x.expectation)}</td>
</tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Y781-Y820 Conformance Test Design</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
    table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px;vertical-align:top}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="card">
    <h1>UAOS Conformance Test Design</h1>
    <h2>Y781-Y790 Test Matrix + Validation Rules</h2>
    <p>This is design only. It does not run a writer and does not create output.</p>
  </div>
  <div class="card">
    <h2>Test Matrix</h2>
    <table><tr><th>ID</th><th>Area</th><th>Objective</th><th>Pass Condition</th><th>Output Allowed</th></tr>${matrixRows}</table>
  </div>
  <div class="card">
    <h2>Validation Rules</h2>
    <table><tr><th>ID</th><th>Name</th><th>Expectation</th></tr>${ruleRows}</table>
  </div>
  <div class="card lock">
    <h2>Safety</h2>
    <p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED | App.jsx: NOT MODIFIED</p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(specRoot, "Y781-test-matrix.json"), JSON.stringify(testMatrix, null, 2), "utf8");
fs.writeFileSync(path.join(specRoot, "Y786-validation-rules.json"), JSON.stringify(validationRules, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y781-y790-test-matrix-validation-rules.json"), JSON.stringify({ testMatrix, validationRules, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y781-y790-conformance-test-matrix-rules-report.json"), JSON.stringify({ phase: "Y781-Y790", status: "PASS_TEST_MATRIX_VALIDATION_RULES_READY", testMatrix, validationRules, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "index.html"), html, "utf8");

console.log("[Y781-Y790 PASS_TEST_MATRIX_VALIDATION_RULES_READY]");
