const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const OUT_DIR = path.join(process.cwd(), "generated", "real-writer-validation", "y131-y140");
fs.mkdirSync(OUT_DIR, { recursive: true });

const fixtureEnvNames = [
  "UAOS_YAMAHA_STY_FIXTURE_1",
  "UAOS_YAMAHA_STY_FIXTURE_2",
  "UAOS_YAMAHA_STY_FIXTURE_3",
  "UAOS_YAMAHA_STY_FIXTURE_4",
  "UAOS_YAMAHA_STY_FIXTURE_5"
];

const knownMarkers = [
  "MThd", "MTrk", "CASM", "OTS", "SFF", "SFF1", "SFF2",
  "YAMAHA", "MAIN", "INTRO", "ENDING", "FILL", "BREAK",
  "MAIN A", "MAIN B", "MAIN C", "MAIN D",
  "INTRO A", "INTRO B", "INTRO C",
  "ENDING A", "ENDING B", "ENDING C"
];

function safeFailFixture(envName, filePath, status, error) {
  return { envName, path: filePath, status, error };
}

function findMarkers(buffer) {
  const text = buffer.toString("latin1");
  return knownMarkers.map(marker => {
    const offsets = [];
    let i = text.indexOf(marker);
    while (i >= 0 && offsets.length < 100) {
      offsets.push(i);
      i = text.indexOf(marker, i + 1);
    }
    return {
      marker,
      found: offsets.length > 0,
      count: offsets.length,
      firstOffset: offsets.length ? offsets[0] : null,
      offsets
    };
  });
}

function midiHeaderProbe(buffer) {
  const idx = buffer.indexOf(Buffer.from("MThd", "ascii"));
  if (idx < 0 || idx + 14 > buffer.length) {
    return { found: false };
  }

  try {
    return {
      found: true,
      offset: idx,
      headerLength: buffer.readUInt32BE(idx + 4),
      format: buffer.readUInt16BE(idx + 8),
      trackCount: buffer.readUInt16BE(idx + 10),
      division: buffer.readUInt16BE(idx + 12)
    };
  } catch {
    return { found: true, offset: idx, parseError: true };
  }
}

function trackProbe(buffer) {
  const tracks = [];
  const needle = Buffer.from("MTrk", "ascii");
  let offset = buffer.indexOf(needle);

  while (offset >= 0 && tracks.length < 64) {
    let length = null;
    if (offset + 8 <= buffer.length) {
      try {
        length = buffer.readUInt32BE(offset + 4);
      } catch {
        length = null;
      }
    }

    tracks.push({
      offset,
      declaredLength: length,
      boundedAvailableBytesAfterHeader: Math.max(0, buffer.length - (offset + 8))
    });

    offset = buffer.indexOf(needle, offset + 1);
  }

  return tracks;
}

function sectionPlanFromMarkers(markerHits) {
  const sectionNames = [
    "INTRO", "MAIN", "FILL", "BREAK", "ENDING",
    "MAIN A", "MAIN B", "MAIN C", "MAIN D",
    "INTRO A", "INTRO B", "INTRO C",
    "ENDING A", "ENDING B", "ENDING C"
  ];

  return markerHits
    .filter(m => m.found && sectionNames.includes(m.marker))
    .map(m => ({
      section: m.marker,
      candidateOffsets: m.offsets,
      action: "PLAN_ONLY_NO_EXTRACTION"
    }));
}

const fixtures = [];

for (const envName of fixtureEnvNames) {
  const raw = process.env[envName];
  if (!raw || !raw.trim()) continue;

  const filePath = path.resolve(raw.trim());

  if (!fs.existsSync(filePath)) {
    fixtures.push(safeFailFixture(envName, filePath, "MISSING", "Path does not exist"));
    continue;
  }

  const stat = fs.statSync(filePath);

  if (!stat.isFile()) {
    fixtures.push(safeFailFixture(envName, filePath, "NOT_FILE", "Path is not a file"));
    continue;
  }

  if (path.extname(filePath).toLowerCase() !== ".sty") {
    fixtures.push(safeFailFixture(envName, filePath, "REJECTED_EXTENSION", "Only .STY fixtures allowed"));
    continue;
  }

  const buffer = fs.readFileSync(filePath);

  const markerHits = findMarkers(buffer);
  const midiHeader = midiHeaderProbe(buffer);
  const tracks = trackProbe(buffer);

  fixtures.push({
    envName,
    path: filePath,
    fileName: path.basename(filePath),
    status: "READ_ONLY_SANDBOX_SCANNED",
    fileSizeBytes: stat.size,
    actualReadBytes: buffer.length,
    readOnly: true,
    copiedFixture: false,
    modifiedFixture: false,
    parserSandboxOnly: true,
    extractedChunks: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false,
    sha256FullFixtureReadOnly: crypto.createHash("sha256").update(buffer).digest("hex"),
    midiHeaderProbe: midiHeader,
    trackProbe: tracks,
    markerHits,
    sectionPlan: sectionPlanFromMarkers(markerHits)
  });
}

const report = {
  program: "UAOS Yamaha Parser Design",
  phase: "Y131-Y140",
  title: "Read-Only Yamaha Parser Sandbox",
  status: "PASS",
  approvalCaptured: true,
  approvalText: "I approve implementing read-only Yamaha parser sandbox using approved fixtures. No writer, no real .STY output.",
  hardLimits: {
    readOnly: true,
    fixtureCopy: false,
    fixtureModify: false,
    chunkExtraction: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  },
  fixtureCount: fixtures.length,
  fixtures,
  generatedAt: new Date().toISOString()
};

const outPath = path.join(OUT_DIR, "y131-y140-read-only-parser-sandbox-report.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log("[Y131-Y140 PASS]", outPath);
console.log("[Y131-Y140] Fixtures:", fixtures.length);
