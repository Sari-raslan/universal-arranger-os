const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1201-y1240", "y1211-y1220-approval-text-templates-report.json");

function fail(msg){ console.error("[Y1211-Y1220 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing approval templates report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1211-Y1220") fail("Wrong phase");
if (r.status !== "PASS_APPROVAL_TEXT_TEMPLATES_READY") fail("Bad status");

const allText = JSON.stringify(r.templates);
for (const risky of ["real writer approval", "real keyboard output approval", "production parser approval", "deploy/public release approval"]) {
  if (!r.templates.invalidTemplatesNotProvidedFor.includes(risky)) fail("Missing invalid-template block: " + risky);
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

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1201-y1240", "y1211-y1220-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1211-Y1220",
    status: "PASS",
    confirmed: [
      "APPROVAL_TEXT_TEMPLATES_READY",
      "NO_REAL_WRITER_TEMPLATE",
      "NO_REAL_OUTPUT_TEMPLATE",
      "NO_PRODUCTION_PARSER_TEMPLATE",
      "NO_DEPLOY_TEMPLATE",
      "NO_WRITER",
      "NO_OUTPUT",
      "NO_OPERATIONAL_CODE"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1211-Y1220 SAFETY PASS]");
