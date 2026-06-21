const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const contractRoot = path.join(sandboxRoot, "06_dryrun_interface_contracts");
const auditRoot = path.join(sandboxRoot, "07_audit_freeze");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y941-y1000");
const outDir = path.join(base, "y961-y980");

fs.mkdirSync(contractRoot, { recursive: true });
fs.mkdirSync(auditRoot, { recursive: true });
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
  sandboxPhase: "PHASE_0_NO_OUTPUT",
  outputAllowed: false,
  auditOnly: true
};

const dryrunRequestSchema = {
  phase: "Y961-Y970",
  title: "Dry-Run Request Schema",
  status: "PASS_DRYRUN_REQUEST_SCHEMA_READY",
  schemaType: "DESIGN_ONLY",
  required: {
    requestId: "string",
    requestType: "DRYRUN_PLAN_ONLY | DESCRIBE_OUTPUT_PLAN_ONLY | RUN_NO_OUTPUT_AUDIT_ONLY",
    sandboxPhase: "PHASE_0_NO_OUTPUT",
    approvalState: "NO_OUTPUT_SANDBOX_ONLY",
    outputAllowed: false,
    writerAllowed: false,
    parserAllowed: false,
    deployAllowed: false,
    fixturesTouchAllowed: false
  },
  deniedRequestTypes: [
    "WRITE_FILE",
    "RUN_REAL_WRITER",
    "EXPORT_KEYBOARD_FILE",
    "RUN_PRODUCTION_PARSER",
    "DEPLOY_PUBLIC_RELEASE",
    "READ_FIXTURES",
    "COPY_FIXTURES",
    "MODIFY_FIXTURES"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const auditContract = {
  phase: "Y971-Y980",
  title: "Sandbox Audit Contract",
  status: "PASS_SANDBOX_AUDIT_CONTRACT_READY",
  auditScope: [
    "scan sandbox generated folder",
    "scan reports/writer-sandbox-phase0",
    "scan public/governance/y941-y1000",
    "verify no forbidden extensions",
    "verify safety flags remain blocked",
    "verify outputAllowed is false"
  ],
  auditDoesNot: [
    "run writer",
    "generate output",
    "read fixtures",
    "run production parser",
    "deploy",
    "modify App.jsx"
  ],
  finalExpectedVerdict: "CLEAN_NO_OUTPUT",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}
const reqRows = Object.entries(dryrunRequestSchema.required).map(([k,v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Audit + Request Contracts</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Audit + Request Contracts</h1><h2>Y961-Y980</h2><p>Audit/request schema only. No writer. No output.</p></div>
<div class="card"><h2>Dry-Run Request Required Fields</h2><table><tr><th>Field</th><th>Expected</th></tr>${reqRows}</table></div>
<div class="card bad"><h2>Denied Request Types</h2><ul>${list(dryrunRequestSchema.deniedRequestTypes)}</ul></div>
<div class="card pass"><h2>Audit Scope</h2><ul>${list(auditContract.auditScope)}</ul></div>
<div class="card lock"><h2>Audit Does Not</h2><ul>${list(auditContract.auditDoesNot)}</ul></div>
</body>
</html>`;

fs.writeFileSync(path.join(contractRoot, "dryrun-request-schema.json"), JSON.stringify(dryrunRequestSchema, null, 2), "utf8");
fs.writeFileSync(path.join(auditRoot, "sandbox-audit-contract.json"), JSON.stringify(auditContract, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y961-y980-audit-request-contracts.json"), JSON.stringify({ dryrunRequestSchema, auditContract, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y961-y980-audit-request-contracts-report.json"), JSON.stringify({ phase: "Y961-Y980", status: "PASS_AUDIT_REQUEST_CONTRACTS_READY_NO_OUTPUT", dryrunRequestSchema, auditContract, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "audit-request-contracts.html"), html, "utf8");

console.log("[Y961-Y980 PASS_AUDIT_REQUEST_CONTRACTS_READY_NO_OUTPUT]");
