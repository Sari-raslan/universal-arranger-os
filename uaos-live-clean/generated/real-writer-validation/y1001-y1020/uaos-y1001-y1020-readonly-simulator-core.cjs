const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const simRoot = path.join(sandboxRoot, "08_readonly_simulator");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y1001-y1080");
const outDir = path.join(base, "y1001-y1020");

fs.mkdirSync(simRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  forbiddenKeyboardExtensions: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  simulatorMode: "READ_ONLY_NO_OUTPUT",
  outputAllowed: false
};

const requests = [
  { id: "REQ-001", type: "VALIDATE_PLAN_ONLY", expected: "ALLOW_READONLY" },
  { id: "REQ-002", type: "DESCRIBE_OUTPUT_PLAN_ONLY", expected: "ALLOW_READONLY" },
  { id: "REQ-003", type: "RUN_NO_OUTPUT_AUDIT_ONLY", expected: "ALLOW_READONLY" },
  { id: "REQ-004", type: "WRITE_FILE", expected: "REJECT" },
  { id: "REQ-005", type: "EXPORT_KEYBOARD_FILE", expected: "REJECT" },
  { id: "REQ-006", type: "RUN_REAL_WRITER", expected: "REJECT" },
  { id: "REQ-007", type: "RUN_PRODUCTION_PARSER", expected: "REJECT" },
  { id: "REQ-008", type: "DEPLOY_PUBLIC_RELEASE", expected: "REJECT" },
  { id: "REQ-009", type: "READ_FIXTURES", expected: "REJECT" },
  { id: "REQ-010", type: "COPY_FIXTURES", expected: "REJECT" },
  { id: "REQ-011", type: "MODIFY_FIXTURES", expected: "REJECT" },
  { id: "REQ-012", type: "MODIFY_APP_JSX", expected: "REJECT" }
];

function simulate(req) {
  const allowed = ["VALIDATE_PLAN_ONLY", "DESCRIBE_OUTPUT_PLAN_ONLY", "RUN_NO_OUTPUT_AUDIT_ONLY"];
  if (allowed.includes(req.type)) {
    return {
      id: req.id,
      type: req.type,
      result: "ALLOW_READONLY",
      outputCreated: false,
      writerTouched: false,
      parserTouched: false,
      fixturesTouched: false,
      appJsxTouched: false
    };
  }
  return {
    id: req.id,
    type: req.type,
    result: "REJECT",
    outputCreated: false,
    writerTouched: false,
    parserTouched: false,
    fixturesTouched: false,
    appJsxTouched: false
  };
}

const results = requests.map(simulate);
const mismatches = results.filter(r => {
  const expected = requests.find(q => q.id === r.id).expected;
  return r.result !== expected;
});

const report = {
  phase: "Y1001-Y1020",
  title: "Read-Only Sandbox Simulator Core",
  status: mismatches.length === 0 ? "PASS_READONLY_SIMULATOR_CORE_READY" : "FAIL_SIMULATOR_MISMATCH",
  requests,
  results,
  mismatches,
  allRejectedCorrectly: mismatches.length === 0,
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = results.map(r => `<tr><td>${esc(r.id)}</td><td>${esc(r.type)}</td><td>${esc(r.result)}</td><td>${r.outputCreated ? "YES" : "NO"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Read-Only Sandbox Simulator</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Read-Only Sandbox Simulator</h1><h2>${esc(report.status)}</h2><p>No writer. No output. Simulator only.</p></div>
<div class="card"><table><tr><th>ID</th><th>Request Type</th><th>Result</th><th>Output Created</th></tr>${rows}</table></div>
<div class="card lock"><h2>Hard Locks</h2><p>Writer: BLOCKED | Real output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED | Fixtures touch: BLOCKED | App.jsx: false</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(simRoot, "readonly-simulator-core.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y1001-y1020-readonly-simulator-core.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1001-y1020-readonly-simulator-core-report.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "readonly-simulator-core.html"), html, "utf8");

if (mismatches.length > 0) {
  console.error("[Y1001-Y1020 FAIL_SIMULATOR_MISMATCH]");
  process.exit(1);
}

console.log("[Y1001-Y1020 PASS_READONLY_SIMULATOR_CORE_READY]");
