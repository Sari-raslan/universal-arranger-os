const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y1021-y1040", "y1021-y1040-negative-test-proof-report.json");

function fail(msg){ console.error("[Y1021-Y1040 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing negative test report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1021-Y1040") fail("Wrong phase");
if (r.status !== "PASS_NEGATIVE_TEST_PROOF_READY") fail("Bad status");
if (r.allForbiddenActionsRejected !== true) fail("Forbidden actions were not all rejected");
if (!Array.isArray(r.failures) || r.failures.length !== 0) fail("Negative failures found");

for (const item of r.results) {
  if (item.actual !== "REJECTED") fail("A forbidden action was not rejected");
  if (item.sideEffect !== false) fail("A forbidden action had a side effect");
}

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.outputAllowed !== false) fail("Output flag failed");

fs.writeFileSync(
  path.join(base, "y1021-y1040", "y1021-y1040-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1021-Y1040",
    status: "PASS",
    confirmed: [
      "NEGATIVE_TEST_MATRIX_READY",
      "ALL_FORBIDDEN_ACTIONS_REJECTED",
      "NO_SIDE_EFFECTS",
      "NO_OUTPUT",
      "NO_WRITER",
      "NO_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1021-Y1040 SAFETY PASS]");
