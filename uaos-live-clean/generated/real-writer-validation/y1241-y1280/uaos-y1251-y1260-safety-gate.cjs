const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1241-y1280", "y1251-y1260-docs-ui-working-rules-report.json");

function fail(msg){ console.error("[Y1251-Y1260 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing Docs/UI rules report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1251-Y1260") fail("Wrong phase");
if (r.status !== "PASS_DOCS_UI_WORKING_RULES_READY") fail("Bad status");
if (r.rules.path !== "PATH-DOCS-UI") fail("Path mismatch");

for (const forbidden of ["writer implementation","keyboard output","production parsers","deployment scripts","fixture access","App.jsx edits"]) {
  if (!r.rules.forbiddenWork.includes(forbidden)) fail("Missing forbidden rule: " + forbidden);
}

const s = r.safety || {};
if (s.selectedPath !== "PATH-DOCS-UI") fail("Safety selected path mismatch");
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.outputAllowed !== false) fail("Output flag failed");
if (s.operationalCode !== "NO") fail("Operational code flag failed");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1241-y1280", "y1251-y1260-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1251-Y1260",
    status: "PASS",
    confirmed: [
      "DOCS_UI_WORKING_RULES_READY",
      "PATH_DOCS_UI_LOCKED",
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

console.log("[Y1251-Y1260 SAFETY PASS]");
