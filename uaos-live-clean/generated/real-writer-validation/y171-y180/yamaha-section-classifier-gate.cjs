const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y171-y180", "y171-y180-section-classification-report.json");
function fail(m){ console.error("[Y171-Y180 GATE FAIL]", m); process.exit(1); }

if (!fs.existsSync(p)) fail("Missing report");
const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y171-Y180") fail("Wrong phase");
if (r.status !== "PASS") fail("Not PASS");
if (r.readOnly !== true) fail("Not read-only");
if (h.fixtureRead !== false) fail("Unexpected fixture read");
if (h.fixtureCopy !== false) fail("Fixture copy not blocked");
if (h.fixtureModify !== false) fail("Fixture modify not blocked");
if (h.payloadExport !== false) fail("Payload export not blocked");
if (h.writerImplementation !== false) fail("Writer not blocked");
if (h.realStyOutput !== false) fail("Real STY output not blocked");
if (h.deploy !== false) fail("Deploy not blocked");

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y171-y180", "y171-y180-safety-gate-report.json"),
  JSON.stringify({ phase:"Y171-Y180", status:"PASS", confirmed:["REPORT_ONLY","NO_FIXTURE_READ","NO_WRITER","NO_REAL_STY_OUTPUT","NO_DEPLOY"], generatedAt:new Date().toISOString() }, null, 2),
  "utf8"
);

console.log("[Y171-Y180 SAFETY PASS]");
