const fs = require("fs");
const path = require("path");

const reportPath = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y151-y160",
  "y151-y160-read-only-chunk-map-report.json"
);

function fail(msg) {
  console.error("[Y151-Y160 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing Y151-Y160 report");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const limits = report.hardLimits || {};

if (report.phase !== "Y151-Y160") fail("Wrong phase");
if (report.status !== "PASS") fail("Report not PASS");
if (!report.approvalCaptured) fail("Approval not captured");

if (limits.readOnly !== true) fail("Read-only missing");
if (limits.fixtureCopy !== false) fail("Fixture copy not blocked");
if (limits.fixtureModify !== false) fail("Fixture modify not blocked");
if (limits.payloadExport !== false) fail("Payload export not blocked");
if (limits.chunkPayloadWrite !== false) fail("Chunk payload write not blocked");
if (limits.writerImplementation !== false) fail("Writer not blocked");
if (limits.realStyOutput !== false) fail("Real STY output not blocked");
if (limits.deploy !== false) fail("Deploy not blocked");

for (const fx of report.fixtures || []) {
  if (fx.copiedFixture) fail(`Fixture copy detected: ${fx.path}`);
  if (fx.modifiedFixture) fail(`Fixture modification detected: ${fx.path}`);
  if (fx.payloadExported) fail(`Payload export detected: ${fx.path}`);
  if (fx.chunkPayloadWritten) fail(`Chunk payload write detected: ${fx.path}`);
  if (fx.writerImplementation) fail(`Writer detected: ${fx.path}`);
  if (fx.realStyOutput) fail(`Real STY output detected: ${fx.path}`);
  if (fx.deploy) fail(`Deploy detected: ${fx.path}`);
}

const out = {
  phase: "Y151-Y160",
  title: "Read-Only Chunk Map Safety Gate",
  status: "PASS",
  confirmed: [
    "READ_ONLY",
    "OFFSET_MAP_ONLY",
    "NO_FIXTURE_COPY",
    "NO_FIXTURE_MODIFY",
    "NO_PAYLOAD_EXPORT",
    "NO_CHUNK_PAYLOAD_WRITE",
    "NO_WRITER",
    "NO_REAL_STY_OUTPUT",
    "NO_DEPLOY"
  ],
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y151-y160", "y151-y160-safety-gate-report.json"),
  JSON.stringify(out, null, 2),
  "utf8"
);

console.log("[Y151-Y160 SAFETY PASS]");
