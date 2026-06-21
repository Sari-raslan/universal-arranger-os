const fs = require("fs");
const path = require("path");

const reportPath = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y111-y120",
  "y111-y120-marker-index-planning-report.json"
);

function fail(msg) {
  console.error("[Y111-Y120 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing Y111-Y120 report");

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const limits = report.hardLimits || {};

if (report.phase !== "Y111-Y120") fail("Wrong phase");
if (report.status !== "PASS") fail("Report not PASS");
if (report.planningOnly !== true) fail("Not planning only");

if (limits.noNewFixtureRead !== true) fail("New fixture read not blocked");
if (limits.usePrefixReportOnly !== true) fail("Not using prefix report only");
if (limits.extractedChunks !== false) fail("Chunk extraction not blocked");
if (limits.fullFileRead !== false) fail("Full file read not blocked");
if (limits.fullParse !== false) fail("Full parse not blocked");
if (limits.parserImplementation !== false) fail("Parser implementation not blocked");
if (limits.writerImplementation !== false) fail("Writer implementation not blocked");
if (limits.realStyOutput !== false) fail("Real STY output not blocked");
if (limits.deploy !== false) fail("Deploy not blocked");

for (const e of report.entries || []) {
  if (e.extractedChunks) fail(`Chunk extraction detected: ${e.path}`);
  if (e.fullFileRead) fail(`Full file read detected: ${e.path}`);
  if (e.fullParse) fail(`Full parse detected: ${e.path}`);
  if (e.parserImplementation) fail(`Parser implementation detected: ${e.path}`);
  if (e.writerImplementation) fail(`Writer implementation detected: ${e.path}`);
  if (e.realStyOutput) fail(`Real STY output detected: ${e.path}`);
}

const out = {
  phase: "Y111-Y120",
  title: "Marker Index Planning Safety Gate",
  status: "PASS",
  confirmed: [
    "PREFIX_REPORT_ONLY",
    "NO_NEW_FIXTURE_READ",
    "NO_CHUNK_EXTRACTION",
    "NO_FULL_PARSE",
    "NO_PARSER_IMPLEMENTATION",
    "NO_WRITER",
    "NO_REAL_STY_OUTPUT",
    "NO_DEPLOY"
  ],
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y111-y120", "y111-y120-safety-gate-report.json"),
  JSON.stringify(out, null, 2),
  "utf8"
);

console.log("[Y111-Y120 SAFETY PASS]");
