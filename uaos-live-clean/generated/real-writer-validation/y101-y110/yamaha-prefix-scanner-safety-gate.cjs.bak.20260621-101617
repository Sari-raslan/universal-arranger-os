const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(process.cwd(), "generated", "real-writer-validation", "y101-y110");
const reportPath = path.join(OUT_DIR, "y101-y110-prefix-scan-report.json");

function fail(message) {
  console.error("[Y101-Y110 SAFETY GATE FAIL]", message);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) {
  fail("Missing prefix scan report");
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

if (report.phase !== "Y101-Y110") fail("Wrong phase");
if (report.status !== "PASS") fail("Report status is not PASS");
if (!report.approvalCaptured) fail("Approval not captured");

const limits = report.hardLimits || {};

if (limits.maxReadBytesPerFixture !== 32768) fail("Max read limit changed");
if (limits.copyFixtures !== false) fail("Fixture copy is not blocked");
if (limits.modifyFixtures !== false) fail("Fixture modification is not blocked");
if (limits.fullFileRead !== false) fail("Full file read is not blocked");
if (limits.fullParse !== false) fail("Full parse is not blocked");
if (limits.parserImplementation !== false) fail("Parser implementation is not blocked");
if (limits.writerImplementation !== false) fail("Writer implementation is not blocked");
if (limits.realStyOutput !== false) fail("Real .STY output is not blocked");
if (limits.deploy !== false) fail("Deploy is not blocked");

for (const fx of report.fixtures || []) {
  if (fx.actualReadBytes && fx.actualReadBytes > 32768) {
    fail(`Fixture exceeded prefix limit: ${fx.path}`);
  }
  if (fx.copiedFixture === true) fail(`Fixture copy detected: ${fx.path}`);
  if (fx.modifiedFixture === true) fail(`Fixture modification detected: ${fx.path}`);
  if (fx.fullParse === true) fail(`Full parse detected: ${fx.path}`);
  if (fx.writer === true) fail(`Writer detected: ${fx.path}`);
  if (fx.realStyOutput === true) fail(`Real .STY output detected: ${fx.path}`);
}

const gateReport = {
  phase: "Y101-Y110",
  title: "Prefix Scanner Safety Gate",
  status: "PASS",
  checkedReport: reportPath,
  confirmedBlocks: [
    "NO_FULL_PARSE",
    "NO_WRITER",
    "NO_REAL_STY_OUTPUT",
    "NO_DEPLOY",
    "NO_FIXTURE_COPY",
    "NO_FIXTURE_MODIFY",
    "MAX_32768_BYTES"
  ],
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(OUT_DIR, "y101-y110-safety-gate-report.json"),
  JSON.stringify(gateReport, null, 2),
  "utf8"
);

console.log("[Y101-Y110 SAFETY GATE PASS]");
