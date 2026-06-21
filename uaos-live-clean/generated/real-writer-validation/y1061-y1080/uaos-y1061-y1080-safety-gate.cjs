const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y1061-y1080", "y1061-y1080-final-safe-closure-report.json");

function fail(msg){ console.error("[Y1061-Y1080 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final closure report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y1061-Y1080") fail("Wrong phase");
if (r.status !== "PASS_FINAL_SAFE_CLOSURE_READY") fail("Bad status");

const c = r.finalClosure || {};
if (c.finalVerdict !== "SAFE_SANDBOX_READONLY_COMPLETE_NO_OUTPUT") fail("Final verdict incorrect");
if (c.forbiddenFound.length !== 0) fail("Forbidden output files found");

const fsx = c.finalState || {};
if (fsx.finalSafeClosure !== "READY") fail("Final closure not ready");
if (fsx.outputAllowed !== "NO") fail("Output must be NO");
if (fsx.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (fsx.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (fsx.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (fsx.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (fsx.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (fsx.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (fsx.appJsxModified !== false) fail("App.jsx flag failed");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Safety writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Safety real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Safety real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Safety production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Safety deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Safety fixtures not blocked");
if (s.appJsxModified !== false) fail("Safety App.jsx failed");
if (s.outputAllowed !== false) fail("Safety output flag failed");

for (const file of [
  "public/governance/y1001-y1080/readonly-simulator-core.html",
  "public/governance/y1001-y1080/negative-test-proof.html",
  "public/governance/y1001-y1080/final-readonly-simulator-dashboard.html",
  "public/governance/y1001-y1080/final-safe-closure.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing public page: " + file);
}

fs.writeFileSync(
  path.join(base, "y1061-y1080", "y1061-y1080-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1061-Y1080",
    status: "PASS",
    confirmed: [
      "FINAL_SAFE_CLOSURE_READY",
      "SAFE_SANDBOX_READONLY_COMPLETE_NO_OUTPUT",
      "NO_FORBIDDEN_OUTPUT_FILES",
      "OUTPUT_ALLOWED_NO",
      "WRITER_BLOCKED",
      "REAL_WRITER_BLOCKED",
      "REAL_OUTPUT_BLOCKED",
      "PRODUCTION_PARSER_BLOCKED",
      "DEPLOY_BLOCKED",
      "FIXTURES_BLOCKED",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1061-Y1080 FINAL SAFETY PASS]");
