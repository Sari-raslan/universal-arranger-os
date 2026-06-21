const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const contractRoot = path.join(sandboxRoot, "06_dryrun_interface_contracts");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y941-y1000");
const outDir = path.join(base, "y941-y960");

fs.mkdirSync(contractRoot, { recursive: true });
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
  contractOnly: true
};

const dryrunInputContract = {
  phase: "Y941-Y950",
  title: "Dry-Run Input Contract",
  status: "PASS_DRYRUN_INPUT_CONTRACT_READY",
  purpose: "Define future dry-run request fields only. This does not run a writer.",
  allowedRequestType: "DRYRUN_PLAN_ONLY",
  requiredFields: [
    "requestId",
    "projectId",
    "targetFamily",
    "intent",
    "sections",
    "tracks",
    "tempo",
    "timeSignature",
    "safetyProfile",
    "approvalState"
  ],
  allowedIntentValues: [
    "VALIDATE_PLAN_ONLY",
    "DESCRIBE_OUTPUT_PLAN_ONLY",
    "RUN_NO_OUTPUT_AUDIT_ONLY"
  ],
  deniedIntentValues: [
    "WRITE_FILE",
    "EXPORT_KEYBOARD_FILE",
    "RUN_REAL_WRITER",
    "RUN_PRODUCTION_PARSER",
    "DEPLOY"
  ],
  approvalStateRequired: "NO_OUTPUT_SANDBOX_ONLY",
  safety,
  generatedAt: new Date().toISOString()
};

const outputPlanContract = {
  phase: "Y951-Y960",
  title: "No-Output Output-Plan Contract",
  status: "PASS_OUTPUT_PLAN_CONTRACT_READY_NO_OUTPUT",
  purpose: "Describe a future output plan without creating output.",
  outputCreationAllowed: false,
  outputPlanAllowedFields: [
    "planId",
    "targetFamily",
    "formatNameTextOnly",
    "expectedSections",
    "expectedTracks",
    "riskLevel",
    "requiredApprovals",
    "blockedOutputExtensions"
  ],
  forbiddenOutputExtensions: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
  note: "Forbidden extensions are mentioned only as blocked text values. No file with these extensions may be created.",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Dry-Run Interface Contracts</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Dry-Run Interface Contracts</h1><h2>Y941-Y960</h2><p>Contract only. No writer. No output.</p></div>
<div class="card pass"><h2>Dry-Run Input Required Fields</h2><ul>${list(dryrunInputContract.requiredFields)}</ul></div>
<div class="card pass"><h2>Allowed Intent Values</h2><ul>${list(dryrunInputContract.allowedIntentValues)}</ul></div>
<div class="card bad"><h2>Denied Intent Values</h2><ul>${list(dryrunInputContract.deniedIntentValues)}</ul></div>
<div class="card lock"><h2>Forbidden Output Extensions</h2><ul>${list(outputPlanContract.forbiddenOutputExtensions)}</ul></div>
<div class="card lock"><h2>Final Rule</h2><p>Output creation allowed: NO</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(contractRoot, "dryrun-input-contract.json"), JSON.stringify(dryrunInputContract, null, 2), "utf8");
fs.writeFileSync(path.join(contractRoot, "output-plan-contract-no-output.json"), JSON.stringify(outputPlanContract, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y941-y960-dryrun-interface-contracts.json"), JSON.stringify({ dryrunInputContract, outputPlanContract, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y941-y960-dryrun-interface-contracts-report.json"), JSON.stringify({ phase: "Y941-Y960", status: "PASS_DRYRUN_INTERFACE_CONTRACTS_READY_NO_OUTPUT", dryrunInputContract, outputPlanContract, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "dryrun-interface-contracts.html"), html, "utf8");

console.log("[Y941-Y960 PASS_DRYRUN_INTERFACE_CONTRACTS_READY_NO_OUTPUT]");
