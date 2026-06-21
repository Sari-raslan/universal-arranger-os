const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1121-y1160", "y1141-y1150-cto-handover-summary-report.json");

function fail(msg){ console.error("[Y1141-Y1150 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing CTO handover report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1141-Y1150") fail("Wrong phase");
if (r.status !== "PASS_CTO_HANDOVER_SUMMARY_READY") fail("Bad status");

if (!r.handover.redLines.some(x => x.includes("No writer implementation"))) fail("Missing writer red line");
if (!r.handover.redLines.some(x => x.includes("No keyboard file output"))) fail("Missing output red line");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1121-y1160", "y1141-y1150-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1141-Y1150",
    status: "PASS",
    confirmed: ["CTO_HANDOVER_SUMMARY_READY","RED_LINES_CONFIRMED","NO_WRITER","NO_OUTPUT","NO_PARSER","NO_DEPLOY","NO_FIXTURES","NO_APP_JSX"],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1141-Y1150 SAFETY PASS]");
