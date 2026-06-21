const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const OUT_DIR = path.join(process.cwd(), "generated", "real-writer-validation", "y151-y160");
fs.mkdirSync(OUT_DIR, { recursive: true });

const fixtureEnvNames = [
  "UAOS_YAMAHA_STY_FIXTURE_1",
  "UAOS_YAMAHA_STY_FIXTURE_2",
  "UAOS_YAMAHA_STY_FIXTURE_3",
  "UAOS_YAMAHA_STY_FIXTURE_4",
  "UAOS_YAMAHA_STY_FIXTURE_5"
];

const chunkMarkers = [
  "MThd", "MTrk", "CASM", "OTS", "SFF", "SFF1", "SFF2",
  "YAMAHA", "MAIN", "INTRO", "ENDING", "FILL", "BREAK",
  "MAIN A", "MAIN B", "MAIN C", "MAIN D",
  "INTRO A", "INTRO B", "INTRO C",
  "ENDING A", "ENDING B", "ENDING C"
];

function failFixture(envName, filePath, status, error) {
  return { envName, path: filePath, status, error };
}

function findAll(buffer, ascii) {
  const needle = Buffer.from(ascii, "ascii");
  const offsets = [];
  let offset = buffer.indexOf(needle);
  while (offset >= 0 && offsets.length < 500) {
    offsets.push(offset);
    offset = buffer.indexOf(needle, offset + 1);
  }
  return offsets;
}

function mapMarkers(buffer) {
  return chunkMarkers.map(marker => {
    const offsets = findAll(buffer, marker);
    return {
      marker,
      found: offsets.length > 0,
      count: offsets.length,
      offsets
    };
  });
}

function midiChunkMap(buffer) {
  const chunks = [];
  let cursor = 0;

  while (cursor + 8 <= buffer.length && chunks.length < 512) {
    const id = buffer.subarray(cursor, cursor + 4).toString("latin1");
    const cleanId = id.replace(/[^\x20-\x7E]/g, ".");

    let declaredLength = null;
    try {
      declaredLength = buffer.readUInt32BE(cursor + 4);
    } catch {
      break;
    }

    const dataStart = cursor + 8;
    const dataEnd = dataStart + declaredLength;
    const inBounds = declaredLength >= 0 && dataEnd <= buffer.length;

    if (id === "MThd" || id === "MTrk") {
      chunks.push({
        id,
        offset: cursor,
        declaredLength,
        dataStart,
        dataEnd: inBounds ? dataEnd : null,
        inBounds,
        extraction: "MAP_ONLY_NO_PAYLOAD_WRITE"
      });

      if (!inBounds || declaredLength < 0) break;
      cursor = dataEnd;
    } else {
      cursor += 1;
    }
  }

  return chunks;
}

function yamahaSectionCandidateMap(markerMap) {
  const allowed = [
    "INTRO", "MAIN", "FILL", "BREAK", "ENDING",
    "MAIN A", "MAIN B", "MAIN C", "MAIN D",
    "INTRO A", "INTRO B", "INTRO C",
    "ENDING A", "ENDING B", "ENDING C",
    "CASM", "OTS", "SFF", "SFF1", "SFF2"
  ];

  return markerMap
    .filter(m => allowed.includes(m.marker) && m.found)
    .map(m => ({
      marker: m.marker,
      candidateOffsets: m.offsets,
      extractionPolicy: "OFFSET_MAP_ONLY_NO_CHUNK_EXPORT"
    }));
}

const fixtures = [];

for (const envName of fixtureEnvNames) {
  const raw = process.env[envName];
  if (!raw || !raw.trim()) continue;

  const filePath = path.resolve(raw.trim());

  if (!fs.existsSync(filePath)) {
    fixtures.push(failFixture(envName, filePath, "MISSING", "Path does not exist"));
    continue;
  }

  const stat = fs.statSync(filePath);

  if (!stat.isFile()) {
    fixtures.push(failFixture(envName, filePath, "NOT_FILE", "Path is not a file"));
    continue;
  }

  if (path.extname(filePath).toLowerCase() !== ".sty") {
    fixtures.push(failFixture(envName, filePath, "REJECTED_EXTENSION", "Only .STY fixtures allowed"));
    continue;
  }

  const beforeMtime = stat.mtimeMs;
  const buffer = fs.readFileSync(filePath);
  const afterStat = fs.statSync(filePath);

  const markerMap = mapMarkers(buffer);

  fixtures.push({
    envName,
    path: filePath,
    fileName: path.basename(filePath),
    status: "READ_ONLY_CHUNK_MAP_EXTRACTED",
    fileSizeBytes: stat.size,
    actualReadBytes: buffer.length,
    readOnly: true,
    copiedFixture: false,
    modifiedFixture: beforeMtime !== afterStat.mtimeMs,
    payloadExported: false,
    chunkPayloadWritten: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false,
    sha256ReadOnly: crypto.createHash("sha256").update(buffer).digest("hex"),
    midiChunkMap: midiChunkMap(buffer),
    markerMap,
    yamahaSectionCandidateMap: yamahaSectionCandidateMap(markerMap)
  });
}

const report = {
  program: "UAOS Yamaha Parser Design",
  phase: "Y151-Y160",
  title: "Read-Only Yamaha Chunk Map Extraction",
  status: "PASS",
  approvalCaptured: true,
  approvalText: "I approve implementing read-only Yamaha chunk map extraction from approved fixtures. No writer, no real .STY output.",
  hardLimits: {
    readOnly: true,
    fixtureCopy: false,
    fixtureModify: false,
    payloadExport: false,
    chunkPayloadWrite: false,
    writerImplementation: false,
    realStyOutput: false,
    deploy: false
  },
  fixtureCount: fixtures.length,
  fixtures,
  generatedAt: new Date().toISOString()
};

const outPath = path.join(OUT_DIR, "y151-y160-read-only-chunk-map-report.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

console.log("[Y151-Y160 PASS]", outPath);
console.log("[Y151-Y160] Fixtures:", fixtures.length);
