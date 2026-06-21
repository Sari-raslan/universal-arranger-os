const fs = require("fs");
const path = require("path");

const inputPath = path.join(process.cwd(), "generated", "real-writer-validation", "y151-y160", "y151-y160-read-only-chunk-map-report.json");
const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y171-y180");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y171-Y180 FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(inputPath)) fail("Missing Y151-Y160 chunk map report");

const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (input.phase !== "Y151-Y160") fail("Wrong input phase");
if (input.status !== "PASS") fail("Input not PASS");

const sectionPatterns = [
  { name: "INTRO", markers: ["INTRO", "INTRO A", "INTRO B", "INTRO C"] },
  { name: "MAIN", markers: ["MAIN", "MAIN A", "MAIN B", "MAIN C", "MAIN D"] },
  { name: "FILL", markers: ["FILL"] },
  { name: "BREAK", markers: ["BREAK"] },
  { name: "ENDING", markers: ["ENDING", "ENDING A", "ENDING B", "ENDING C"] },
  { name: "CASM", markers: ["CASM"] },
  { name: "OTS", markers: ["OTS"] },
  { name: "SFF", markers: ["SFF", "SFF1", "SFF2"] }
];

function countMarkers(fx, markers) {
  const markerMap = fx.markerMap || [];
  let count = 0;
  const offsets = [];
  for (const marker of markers) {
    const hit = markerMap.find(m => m.marker === marker);
    if (hit && hit.found) {
      count += hit.count || 0;
      offsets.push(...(hit.offsets || []).map(offset => ({ marker, offset })));
    }
  }
  return { count, offsets };
}

const fixtures = (input.fixtures || []).map(fx => {
  if (fx.status !== "READ_ONLY_CHUNK_MAP_EXTRACTED") {
    return {
      path: fx.path,
      fileName: fx.fileName || null,
      sourceStatus: fx.status,
      status: "SKIPPED_NON_CHUNK_MAP"
    };
  }

  const sections = sectionPatterns.map(pattern => {
    const found = countMarkers(fx, pattern.markers);
    return {
      sectionType: pattern.name,
      markerCount: found.count,
      evidenceOffsets: found.offsets,
      classification: found.count > 0 ? "CANDIDATE_PRESENT" : "NOT_DETECTED",
      policy: "CLASSIFICATION_ONLY_NO_EXTRACTION"
    };
  });

  return {
    path: fx.path,
    fileName: fx.fileName,
    status: "SECTION_CLASSIFIED_FROM_APPROVED_CHUNK_MAP",
    sourceSha256: fx.sha256ReadOnly || null,
    sections,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  };
});

const report = {
  phase: "Y171-Y180",
  title: "Yamaha Section Classification From Approved Chunk Maps",
  status: "PASS",
  source: "Y151-Y160 read-only chunk map report",
  readOnly: true,
  planningOnly: true,
  fixtureCount: fixtures.length,
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

fs.writeFileSync(path.join(outDir, "y171-y180-section-classification-report.json"), JSON.stringify(report, null, 2), "utf8");
console.log("[Y171-Y180 PASS]");
