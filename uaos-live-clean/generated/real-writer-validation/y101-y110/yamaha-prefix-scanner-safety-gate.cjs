const fs = require("fs");
const path = require("path");

const reportPath = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y101-y110",
  "y101-y110-prefix-scan-report.json"
);

function fail(msg) {
  console.error("[Y101-Y110 SAFETY FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing prefix scan report");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const limits = report.hardLimits || {};

if (report.phase !== "Y101-Y110") fail("Wrong phase");
if (report.status !== "PASS") fail("Report not PASS");
if (!report.approvalCaptured) fail("Approval not captured");

if (limits.maxReadBytesPerFixture !== 32768) fail("Max read limit changed");
if (limits.copyFixtures !== false) fail("Copy fixtures not blocked");
if (limits.modifyFixtures !== false) fail("Modify fixtures not blocked");
if (limits.fullFileRead !== false) fail("Full file read not blocked");
if (limits.fullParse !== false) fail("Full parse not blocked");
if (limits.parserImplementation !== false) fail("Parser implementation not blocked");
if (limits.writerImplementation !== false) fail("Writer implementation not blocked");
if (limits.realStyOutput !== false) fail("Real STY output not blocked");
if (limits.deploy !== false) fail("Deploy not blocked");

for (const fx of report.fixtures || []) {
  if ((fx.actualReadBytes || 0) > 32768) fail(`Read too much: ${fx.path}`);
  if (fx.copiedFixture) fail(`Copy detected: ${fx.path}`);
  if (fx.modifiedFixture) fail(`Modify detected: ${fx.path}`);
  if (fx.fullFileRead) fail(`Full file read detected: ${fx.path}`);
  if (fx.fullParse) fail(`Full parse detected: ${fx.path}`);
  if (fx.parserImplementation) fail(`Parser implementation detected: ${fx.path}`);
  if (fx.writerImplementation) fail(`Writer implementation detected: ${fx.path}`);
  if (fx.realStyOutput) fail(`Real STY output detected: ${fx.path}`);
}

const out = {
  phase: "Y101-Y110",
  title: "Prefix Scanner Safety Gate",
  status: "PASS",
  confirmed: [
    "MAX_32768_BYTES",
    "READ_ONLY",
    "NO_FULL_FILE_READ",
    "NO_FULL_PARSE",
    "NO_PARSER_IMPLEMENTATION",
    "NO_WRITER",
    "NO_REAL_STY_OUTPUT",
    "NO_DEPLOY"
  ],
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y101-y110", "y101-y110-safety-gate-report.json"),
  JSON.stringify(out, null, 2),
  "utf8"
);

console.log("[Y101-Y110 SAFETY PASS]");
