const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y761-y770", "y761-y770-error-rollback-blocker-report.json");

function fail(msg){ console.error("[Y761-Y770 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y761-Y770") fail("Wrong phase");
if (r.status !== "PASS_ERROR_ROLLBACK_BLOCKER_READY") fail("Bad status");
if (r.blockerGate.verdict !== "WRITER_IMPLEMENTATION_BLOCKED") fail("Writer blocker gate not active");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");

const requiredFailures = [
  "WRITER_IMPL_DETECTED",
  "REAL_OUTPUT_ATTEMPT",
  "FORBIDDEN_EXTENSION_CREATED",
  "FIXTURE_ACCESS_DETECTED",
  "PRODUCTION_PARSER_REFERENCE",
  "DEPLOY_ACTION_DETECTED",
  "APP_JSX_TOUCH_DETECTED"
];

const ids = r.errorHandling.failureTaxonomy.map(x => x.id);
for (const id of requiredFailures) {
  if (!ids.includes(id)) fail("Missing stop rule: " + id);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y761-y770", "y761-y770-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y761-Y770",
    status: "PASS",
    confirmed: [
      "ERROR_HANDLING_SPEC_READY",
      "ROLLBACK_FREEZE_SPEC_READY",
      "WRITER_BLOCKER_GATE_ACTIVE",
      "NO_WRITER_IMPLEMENTATION",
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

console.log("[Y761-Y770 SAFETY PASS]");
