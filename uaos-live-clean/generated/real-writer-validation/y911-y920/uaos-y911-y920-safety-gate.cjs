const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y911-y920", "y911-y920-no-output-harness-scanner-report.json");

function fail(msg){ console.error("[Y911-Y920 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing harness scanner report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y911-Y920") fail("Wrong phase");
if (r.status !== "PASS_NO_OUTPUT_HARNESS_SCANNER_READY") fail("Bad status");
if (r.harness.outputAllowed !== false) fail("Output must not be allowed");
if (r.scanner.clean !== true) fail("Scanner not clean");
if (r.scanner.forbiddenFound.length !== 0) fail("Forbidden files found");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.forbiddenKeyboardExtensions !== "BLOCKED") fail("Forbidden extensions not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.noOutputHarnessActive !== true) fail("No-output harness not active");

fs.writeFileSync(
  path.join(base, "y911-y920", "y911-y920-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y911-Y920",
    status: "PASS",
    confirmed: [
      "NO_OUTPUT_HARNESS_READY",
      "FORBIDDEN_EXTENSION_SCANNER_READY",
      "SCAN_CLEAN",
      "NO_WRITER_IMPLEMENTATION",
      "NO_REAL_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES_TOUCH",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y911-Y920 SAFETY PASS]");
