const fs = require("fs");
const path = require("path");

const inputPath = path.join(process.cwd(), "generated", "real-writer-validation", "y171-y180", "y171-y180-section-classification-report.json");
const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y181-y190");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg){ console.error("[Y181-Y190 FAIL]", msg); process.exit(1); }

if (!fs.existsSync(inputPath)) fail("Missing Y171-Y180 report");
const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (input.phase !== "Y171-Y180" || input.status !== "PASS") fail("Invalid input report");

function scoreSection(s) {
  const c = s.markerCount || 0;
  let confidence = 0;
  if (c > 0) confidence = Math.min(95, 35 + c * 12);
  return {
    sectionType: s.sectionType,
    markerCount: c,
    confidence,
    confidenceBand: confidence >= 75 ? "HIGH" : confidence >= 45 ? "MEDIUM" : confidence > 0 ? "LOW" : "NONE",
    evidenceCount: Array.isArray(s.evidenceOffsets) ? s.evidenceOffsets.length : 0,
    policy: "SCORING_ONLY_NO_EXPORT"
  };
}

const fixtures = (input.fixtures || []).map(fx => ({
  path: fx.path,
  fileName: fx.fileName || null,
  status: fx.status === "SECTION_CLASSIFIED_FROM_APPROVED_CHUNK_MAP" ? "SECTION_CONFIDENCE_SCORED" : "SKIPPED",
  scores: (fx.sections || []).map(scoreSection),
  writerImplementation: false,
  realStyOutput: false,
  deploy: false
}));

const report = {
  phase: "Y181-Y190",
  title: "Section Confidence Scoring",
  status: "PASS",
  source: "Y171-Y180 classification report",
  readOnly: true,
  planningOnly: true,
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

fs.writeFileSync(path.join(outDir, "y181-y190-section-confidence-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log("[Y181-Y190 PASS]");
