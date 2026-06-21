const fs = require("fs");
const path = require("path");

const p = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y231-y240",
  "y231-y240-parser-rule-design-report.json"
);

function fail(m) {
  console.error("[Y231-Y240 GATE FAIL]", m);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing rule design report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y231-Y240") fail("Wrong phase");
if (r.status !== "PASS") fail("Not PASS");
if (r.sourceReportsOnly !== true) fail("Not source-reports-only");

if (h.useExistingReportsOnly !== true) fail("Existing reports only not enforced");
if (h.fixtureRead !== false) fail("Fixture read not blocked");
if (h.fixtureCopy !== false) fail("Fixture copy not blocked");
if (h.fixtureModify !== false) fail("Fixture modify not blocked");
if (h.chunkExtraction !== false) fail("Chunk extraction not blocked");
if (h.payloadExport !== false) fail("Payload export not blocked");
if (h.productionParserImplementation !== false) fail("Production parser not blocked");
if (h.writerImplementation !== false) fail("Writer not blocked");
if (h.realStyOutput !== false) fail("Real STY output not blocked");
if (h.deploy !== false) fail("Deploy not blocked");

for (const rule of ((r.ruleDesign || {}).sectionRules || [])) {
  if (rule.allowedAction !== "DESIGN_ONLY") fail(`Rule is not design-only: ${rule.id}`);
  const forbidden = rule.forbiddenActions || [];
  for (const required of ["fixtureRead", "chunkExtraction", "payloadExport", "writerImplementation", "realStyOutput"]) {
    if (!forbidden.includes(required)) fail(`Rule missing forbidden action ${required}: ${rule.id}`);
  }
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y231-y240", "y231-y240-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y231-Y240",
    status: "PASS",
    confirmed: [
      "EXISTING_REPORTS_ONLY",
      "DESIGN_ONLY",
      "NO_FIXTURE_READ",
      "NO_CHUNK_EXTRACTION",
      "NO_PRODUCTION_PARSER",
      "NO_WRITER",
      "NO_REAL_STY_OUTPUT",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y231-Y240 SAFETY PASS]");
