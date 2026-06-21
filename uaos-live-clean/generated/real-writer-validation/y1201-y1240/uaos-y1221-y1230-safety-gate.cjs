const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1201-y1240", "y1221-y1230-risk-acceptance-checklist-report.json");

function fail(msg){ console.error("[Y1221-Y1230 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing risk acceptance report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1221-Y1230") fail("Wrong phase");
if (r.status !== "PASS_RISK_ACCEPTANCE_CHECKLIST_READY") fail("Bad status");
if (r.checklist.currentRiskAcceptance !== "NOT_ACCEPTED") fail("Risk acceptance must be NOT_ACCEPTED");

for (const level of r.checklist.riskLevels) {
  if (level.acceptedNow !== false) fail("Risk accepted unexpectedly");
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
  path.join(appRoot, "generated", "real-writer-validation", "y1201-y1240", "y1221-y1230-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1221-Y1230",
    status: "PASS",
    confirmed: [
      "RISK_ACCEPTANCE_CHECKLIST_READY",
      "RISK_NOT_ACCEPTED_NOW",
      "NO_WRITER",
      "NO_OUTPUT",
      "NO_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX",
      "NO_OPERATIONAL_CODE"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1221-Y1230 SAFETY PASS]");
