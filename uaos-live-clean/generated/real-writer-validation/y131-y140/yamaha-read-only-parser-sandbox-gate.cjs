const fs = require("fs");
const path = require("path");

const reportPath = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y131-y140",
  "y131-y140-read-only-parser-sandbox-report.json"
);

function fail(msg) {
  console.error("[Y131-Y140 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing Y131-Y140 sandbox report");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const limits = report.hardLimits || {};

if (report.phase !== "Y131-Y140") fail("Wrong phase");
if (report.status !== "PASS") fail("Report not PASS");
if (!report.approvalCaptured) fail("Approval not captured");

if (limits.readOnly !== true) fail("Read-only flag missing");
if (limits.fixtureCopy !== false) fail("Fixture copy not blocked");
if (limits.fixtureModify !== false) fail("Fixture modify not blocked");
if (limits.chunkExtraction !== false) fail("Chunk extraction not blocked");
if (limits.writerImplementation !== false) fail("Writer implementation not blocked");
if (limits.realStyOutput !== false) fail("Real STY output not blocked");
if (limits.deploy !== false) fail("Deploy not blocked");

for (const fx of report.fixtures || []) {
  if (fx.copiedFixture) fail(`Fixture copy detected: ${fx.path}`);
  if (fx.modifiedFixture) fail(`Fixture modification detected: ${fx.path}`);
  if (fx.extractedChunks) fail(`Chunk extraction detected: ${fx.path}`);
  if (fx.writerImplementation) fail(`Writer detected: ${fx.path}`);
  if (fx.realStyOutput) fail(`Real STY output detected: ${fx.path}`);
  if (fx.deploy) fail(`Deploy detected: ${fx.path}`);
}

const out = {
  phase: "Y131-Y140",
  title: "Read-Only Parser Sandbox Gate",
  status: "PASS",
  confirmed: [
    "READ_ONLY",
    "NO_FIXTURE_COPY",
    "NO_FIXTURE_MODIFY",
    "NO_CHUNK_EXTRACTION",
    "NO_WRITER",
    "NO_REAL_STY_OUTPUT",
    "NO_DEPLOY"
  ],
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y131-y140", "y131-y140-safety-gate-report.json"),
  JSON.stringify(out, null, 2),
  "utf8"
);

console.log("[Y131-Y140 SAFETY PASS]");
