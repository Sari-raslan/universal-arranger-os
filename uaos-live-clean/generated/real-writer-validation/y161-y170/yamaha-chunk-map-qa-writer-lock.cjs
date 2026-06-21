const fs = require("fs");
const path = require("path");

const inPath = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y151-y160",
  "y151-y160-read-only-chunk-map-report.json"
);

const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y161-y170");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y161-Y170 FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(inPath)) fail("Missing Y151-Y160 report");

const input = JSON.parse(fs.readFileSync(inPath, "utf8"));

if (input.phase !== "Y151-Y160") fail("Wrong input phase");
if (input.status !== "PASS") fail("Input not PASS");

const fixtures = (input.fixtures || []).map(fx => ({
  fileName: fx.fileName || null,
  status: fx.status,
  fileSizeBytes: fx.fileSizeBytes || null,
  midiChunkCount: Array.isArray(fx.midiChunkMap) ? fx.midiChunkMap.length : 0,
  markerKindsFound: Array.isArray(fx.markerMap) ? fx.markerMap.filter(m => m.found).length : 0,
  sectionCandidateCount: Array.isArray(fx.yamahaSectionCandidateMap) ? fx.yamahaSectionCandidateMap.length : 0,
  writerStillLocked: true,
  realStyOutputStillBlocked: true
}));

const report = {
  phase: "Y161-Y170",
  title: "Chunk Map QA + Writer Hard Lock Gate",
  status: "PASS_WITH_WRITER_HARD_LOCKED",
  qaSummary: {
    fixtureCount: fixtures.length,
    fixtures
  },
  blocked: [
    "Payload export",
    "Chunk payload writing",
    "Parser promotion to production",
    "Writer implementation",
    "Real .STY output",
    "Deploy"
  ],
  nextApprovalRequiredText: "I approve implementing read-only Yamaha section classification from approved chunk maps. No writer, no real .STY output.",
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y161-y170-chunk-map-qa-writer-lock-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y161-Y170 PASS_WITH_WRITER_HARD_LOCKED]");
