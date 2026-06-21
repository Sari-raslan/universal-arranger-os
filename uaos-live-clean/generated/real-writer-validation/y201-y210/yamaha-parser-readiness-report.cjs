const fs = require("fs");
const path = require("path");

const summaryPath = path.join(process.cwd(), "generated", "real-writer-validation", "y191-y200", "y191-y200-style-structure-summary-report.json");
const chunkPath = path.join(process.cwd(), "generated", "real-writer-validation", "y151-y160", "y151-y160-read-only-chunk-map-report.json");
const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y201-y210");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg){ console.error("[Y201-Y210 FAIL]", msg); process.exit(1); }
if (!fs.existsSync(summaryPath)) fail("Missing Y191-Y200 report");
if (!fs.existsSync(chunkPath)) fail("Missing Y151-Y160 report");

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const chunk = JSON.parse(fs.readFileSync(chunkPath, "utf8"));

const fixtureCount = (summary.fixtures || []).length;
const withMain = (summary.fixtures || []).filter(f => (f.detectedSectionTypes || []).includes("MAIN")).length;
const withAny = (summary.fixtures || []).filter(f => (f.detectedSectionTypes || []).length > 0).length;

const readiness = fixtureCount === 0 ? "NO_FIXTURES" :
  withMain > 0 ? "READY_FOR_NEXT_READ_ONLY_DESIGN_GATE" :
  withAny > 0 ? "NEEDS_MORE_FIXTURE_EVIDENCE" :
  "NOT_READY";

const report = {
  phase: "Y201-Y210",
  title: "Parser Readiness Report",
  status: "PASS",
  readiness,
  evidence: {
    fixtureCount,
    fixturesWithAnySection: withAny,
    fixturesWithMainSection: withMain,
    sourceReports: [
      "Y151-Y160 read-only chunk map",
      "Y191-Y200 style structure summary"
    ]
  },
  nextSafeStep: "Read-only parser rule design gate only. No writer.",
  hardLimits: {
    productionParser: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(outDir, "y201-y210-parser-readiness-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log("[Y201-Y210 PASS]", readiness);
