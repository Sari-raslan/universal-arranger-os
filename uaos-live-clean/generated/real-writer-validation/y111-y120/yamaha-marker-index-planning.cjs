const fs = require("fs");
const path = require("path");

const inPath = path.join(
  process.cwd(),
  "generated",
  "real-writer-validation",
  "y101-y110",
  "y101-y110-prefix-scan-report.json"
);

const outDir = path.join(process.cwd(), "generated", "real-writer-validation", "y111-y120");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y111-Y120 FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(inPath)) fail("Missing Y101-Y110 prefix report");

const input = JSON.parse(fs.readFileSync(inPath, "utf8"));

if (input.phase !== "Y101-Y110") fail("Wrong input phase");
if (input.status !== "PASS") fail("Input report not PASS");

const entries = [];

for (const fx of input.fixtures || []) {
  if (fx.status !== "PREFIX_SCANNED_READ_ONLY") {
    entries.push({
      envName: fx.envName,
      path: fx.path,
      sourceStatus: fx.status,
      status: "SKIPPED_NON_SCANNED_FIXTURE"
    });
    continue;
  }

  const markers = (fx.markerHits || [])
    .filter(m => m.found)
    .map(m => ({
      marker: m.marker,
      offsetsWithinPrefixOnly: m.offsetsWithinPrefixOnly || [],
      firstOffset: m.firstOffset
    }));

  entries.push({
    envName: fx.envName,
    path: fx.path,
    fileName: fx.fileName,
    status: "PREFIX_MARKER_INDEX_PLANNED_ONLY",
    sourceReadLimitBytes: fx.maxReadBytes,
    actualReadBytes: fx.actualReadBytes,
    sha256Prefix: fx.sha256Prefix,
    markers,
    planningOnly: true,
    extractedChunks: false,
    fullFileRead: false,
    fullParse: false,
    parserImplementation: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  });
}

const report = {
  phase: "Y111-Y120",
  title: "Marker Index Planning From Prefix Report Only",
  status: "PASS",
  source: "Y101-Y110 prefix scan report",
  planningOnly: true,
  hardLimits: {
    noNewFixtureRead: true,
    usePrefixReportOnly: true,
    extractedChunks: false,
    fullFileRead: false,
    fullParse: false,
    parserImplementation: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  },
  fixtureCount: entries.length,
  entries,
  generatedAt: new Date().toISOString()
};

const outPath = path.join(outDir, "y111-y120-marker-index-planning-report.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log("[Y111-Y120 PASS]", outPath);
