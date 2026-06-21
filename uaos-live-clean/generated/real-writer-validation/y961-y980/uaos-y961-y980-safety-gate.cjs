const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y961-y980", "y961-y980-audit-request-contracts-report.json");

function fail(msg){ console.error("[Y961-Y980 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing audit request contracts report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y961-Y980") fail("Wrong phase");
if (r.status !== "PASS_AUDIT_REQUEST_CONTRACTS_READY_NO_OUTPUT") fail("Bad status");

const required = r.dryrunRequestSchema.required || {};
if (required.outputAllowed !== false) fail("Request schema outputAllowed must be false");
if (required.writerAllowed !== false) fail("writerAllowed must be false");
if (required.parserAllowed !== false) fail("parserAllowed must be false");
if (required.deployAllowed !== false) fail("deployAllowed must be false");
if (required.fixturesTouchAllowed !== false) fail("fixturesTouchAllowed must be false");
if (r.auditContract.finalExpectedVerdict !== "CLEAN_NO_OUTPUT") fail("Expected verdict must be CLEAN_NO_OUTPUT");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.forbiddenKeyboardExtensions !== "BLOCKED") fail("Forbidden extensions not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.outputAllowed !== false) fail("Output flag must be false");
if (s.auditOnly !== true) fail("Audit-only flag failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(base, "writer-sandbox-phase0-no-output"),
  path.join(appRoot, "reports", "writer-sandbox-phase0"),
  path.join(appRoot, "public", "governance", "y941-y1000")
];

function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

for (const root of roots) {
  for (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase();
    if (forbiddenOutputExt.includes(ext)) fail("Forbidden output file exists: " + file);
  }
}

fs.writeFileSync(
  path.join(base, "y961-y980", "y961-y980-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y961-Y980",
    status: "PASS",
    confirmed: [
      "DRYRUN_REQUEST_SCHEMA_READY",
      "SANDBOX_AUDIT_CONTRACT_READY",
      "CLEAN_NO_OUTPUT_EXPECTED",
      "NO_WRITER_IMPLEMENTATION",
      "NO_REAL_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES_TOUCH",
      "NO_APP_JSX",
      "NO_FORBIDDEN_OUTPUT_FILES_CREATED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y961-Y980 SAFETY PASS]");
