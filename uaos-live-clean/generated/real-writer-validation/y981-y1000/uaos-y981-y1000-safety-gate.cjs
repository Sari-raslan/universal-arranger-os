const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y981-y1000", "y981-y1000-sandbox-audit-freeze-report.json");

function fail(msg){ console.error("[Y981-Y1000 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing audit freeze report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y981-Y1000") fail("Wrong phase");
if (r.status !== "PASS_SANDBOX_AUDIT_FREEZE_READY_NO_OUTPUT") fail("Bad status");
if (r.auditRunner.clean !== true) fail("Audit not clean");
if (r.auditRunner.forbiddenFound.length !== 0) fail("Forbidden files found");

const f = r.finalFreeze || {};
if (f.freezeState !== "FROZEN_CLEAN_NO_OUTPUT") fail("Freeze state incorrect");
if (f.finalVerdict !== "Y941_Y1000_READY_NO_OUTPUT") fail("Final verdict incorrect");
if (f.outputAllowed !== "NO") fail("Output must be NO");
if (f.writerAllowed !== "NO") fail("Writer must be NO");
if (f.realWriterAllowed !== "NO") fail("Real writer must be NO");
if (f.realKeyboardOutputAllowed !== "NO") fail("Real output must be NO");
if (f.productionParserAllowed !== "NO") fail("Production parser must be NO");
if (f.deployAllowed !== "NO") fail("Deploy must be NO");
if (f.fixturesTouchAllowed !== "NO") fail("Fixtures touch must be NO");
if (f.appJsxModified !== false) fail("App.jsx flag failed");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.forbiddenKeyboardExtensions !== "BLOCKED") fail("Forbidden extensions not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("Safety App.jsx failed");
if (s.outputAllowed !== false) fail("Safety output flag failed");
if (s.finalFreeze !== true) fail("Final freeze flag failed");

for (const file of [
  "public/governance/y941-y1000/dryrun-interface-contracts.html",
  "public/governance/y941-y1000/audit-request-contracts.html",
  "public/governance/y941-y1000/final-sandbox-audit-freeze.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing public page: " + file);
}

fs.writeFileSync(
  path.join(base, "y981-y1000", "y981-y1000-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y981-Y1000",
    status: "PASS",
    confirmed: [
      "SANDBOX_AUDIT_RUNNER_CLEAN",
      "FINAL_SANDBOX_INTERFACE_FREEZE_READY",
      "FROZEN_CLEAN_NO_OUTPUT",
      "OUTPUT_ALLOWED_NO",
      "WRITER_ALLOWED_NO",
      "REAL_WRITER_ALLOWED_NO",
      "REAL_OUTPUT_ALLOWED_NO",
      "PRODUCTION_PARSER_ALLOWED_NO",
      "DEPLOY_ALLOWED_NO",
      "FIXTURES_TOUCH_ALLOWED_NO",
      "NO_APP_JSX",
      "NO_FORBIDDEN_OUTPUT_FILES_CREATED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y981-Y1000 FINAL SAFETY PASS]");
