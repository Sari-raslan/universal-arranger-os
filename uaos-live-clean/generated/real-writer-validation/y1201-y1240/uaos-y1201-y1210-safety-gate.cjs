const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1201-y1240", "y1201-y1210-approval-decision-pages-report.json");

function fail(msg){ console.error("[Y1201-Y1210 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing approval decision report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1201-Y1210") fail("Wrong phase");
if (r.status !== "PASS_APPROVAL_DECISION_PAGES_READY") fail("Bad status");
if (r.decisions.currentDecision !== "NO_DECISION_SELECTED") fail("Decision must not be selected");
if (r.decisions.noFurtherCodeGate !== "ACTIVE") fail("No-further-code gate must be active");

for (const d of r.decisions.allowedDecisionTypes) {
  if (d.writerAllowed !== false) fail("Writer allowed unexpectedly");
  if (d.outputAllowed !== false) fail("Output allowed unexpectedly");
  if (d.parserAllowed !== false) fail("Parser allowed unexpectedly");
  if (d.deployAllowed !== false) fail("Deploy allowed unexpectedly");
  if (d.fixturesAllowed !== false) fail("Fixtures allowed unexpectedly");
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
if (s.operationalCode !== "NO") fail("Operational code flag failed");
if (s.noFurtherCodeGate !== "ACTIVE") fail("No-further-code gate flag failed");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1201-y1240", "y1201-y1210-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1201-Y1210",
    status: "PASS",
    confirmed: [
      "APPROVAL_DECISION_PAGES_READY",
      "NO_DECISION_SELECTED",
      "NO_FURTHER_CODE_GATE_ACTIVE",
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

console.log("[Y1201-Y1210 SAFETY PASS]");
