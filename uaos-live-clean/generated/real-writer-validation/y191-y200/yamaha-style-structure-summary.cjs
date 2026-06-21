const fs = require("fs");
const path = require("path");

const inputPath = path.join(process.cwd(), "generated", "real-writer-validation", "y181-y190", "y181-y190-section-confidence-report.json");
const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y191-y200");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg){ console.error("[Y191-Y200 FAIL]", msg); process.exit(1); }

if (!fs.existsSync(inputPath)) fail("Missing Y181-Y190 report");
const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (input.phase !== "Y181-Y190" || input.status !== "PASS") fail("Invalid input");

const fixtures = (input.fixtures || []).map(fx => {
  const scores = fx.scores || [];
  const present = scores.filter(s => s.confidence > 0);
  const high = scores.filter(s => s.confidenceBand === "HIGH").map(s => s.sectionType);
  const medium = scores.filter(s => s.confidenceBand === "MEDIUM").map(s => s.sectionType);
  const low = scores.filter(s => s.confidenceBand === "LOW").map(s => s.sectionType);

  return {
    path: fx.path,
    fileName: fx.fileName,
    status: "STYLE_STRUCTURE_SUMMARIZED",
    detectedSectionTypes: present.map(s => s.sectionType),
    highConfidenceSections: high,
    mediumConfidenceSections: medium,
    lowConfidenceSections: low,
    likelyStyleCompleteness: high.includes("MAIN") ? "PARTIAL_OR_BETTER" : present.length ? "WEAK_PARTIAL" : "UNKNOWN",
    summaryOnly: true,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  };
});

const report = {
  phase: "Y191-Y200",
  title: "Style Structure Summary",
  status: "PASS",
  source: "Y181-Y190 confidence report",
  readOnly: true,
  summaryOnly: true,
  fixtures,
  hardLimits: {
    fixtureRead: false,
    fixtureCopy: false,
    fixtureModify: false,
    payloadExport: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(outDir, "y191-y200-style-structure-summary-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log("[Y191-Y200 PASS]");
