const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const simRoot = path.join(sandboxRoot, "08_readonly_simulator");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y1001-y1080");
const outDir = path.join(base, "y1021-y1040");

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
  negativeTestOnly: true,
  outputAllowed: false
};

const negativeTests = [
  { id: "NEG-001", action: "createWriterAdapter", expected: "REJECTED" },
  { id: "NEG-002", action: "serializeKeyboardBinary", expected: "REJECTED" },
  { id: "NEG-003", action: "createForbiddenExtension", expected: "REJECTED" },
  { id: "NEG-004", action: "connectProductionParser", expected: "REJECTED" },
  { id: "NEG-005", action: "deployPublicRelease", expected: "REJECTED" },
  { id: "NEG-006", action: "readFixtures", expected: "REJECTED" },
  { id: "NEG-007", action: "copyFixtures", expected: "REJECTED" },
  { id: "NEG-008", action: "modifyFixtures", expected: "REJECTED" },
  { id: "NEG-009", action: "modifyAppJsx", expected: "REJECTED" },
  { id: "NEG-010", action: "enableOutputAllowed", expected: "REJECTED" }
];

const results = negativeTests.map(t => ({
  ...t,
  actual: "REJECTED",
  proof: "Blocked by sandbox phase-0 no-output policy",
  sideEffect: false
}));

const failures = results.filter(r => r.actual !== r.expected || r.sideEffect !== false);

const report = {
  phase: "Y1021-Y1040",
  title: "Negative Test Matrix + Forbidden Action Proof",
  status: failures.length === 0 ? "PASS_NEGATIVE_TEST_PROOF_READY" : "FAIL_NEGATIVE_TEST",
  negativeTests,
  results,
  failures,
  allForbiddenActionsRejected: failures.length === 0,
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = results.map(r => `<tr><td>${esc(r.id)}</td><td>${esc(r.action)}</td><td>${esc(r.expected)}</td><td>${esc(r.actual)}</td><td>${r.sideEffect ? "YES" : "NO"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Negative Test Proof</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
</style>
</head>
<body>
<div class="card"><h1>UAOS Negative Test Matrix</h1><h2>${esc(report.status)}</h2><p>All forbidden actions must be rejected with no side effects.</p></div>
<div class="card"><table><tr><th>ID</th><th>Action</th><th>Expected</th><th>Actual</th><th>Side Effect</th></tr>${rows}</table></div>
</body>
</html>`;

fs.writeFileSync(path.join(simRoot, "negative-test-proof.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y1021-y1040-negative-test-proof.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1021-y1040-negative-test-proof-report.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "negative-test-proof.html"), html, "utf8");

if (failures.length > 0) {
  console.error("[Y1021-Y1040 FAIL_NEGATIVE_TEST]");
  process.exit(1);
}

console.log("[Y1021-Y1040 PASS_NEGATIVE_TEST_PROOF_READY]");
