import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const UAOS_R2_R6_VERSION = "R2-R6.0.0";

export const SAFE_READ_LIMIT_BYTES = 4096;

export const SUPPORTED_EXTENSIONS = [
  ".sty",
  ".set",
  ".prs",
  ".stl",
  ".pat",
  ".msp",
  ".kst",
  ".mid",
  ".kar"
];

function exists(file) {
  try {
    return fs.existsSync(file);
  } catch {
    return false;
  }
}

function readJson(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function safeReadHeader(file, maxBytes = SAFE_READ_LIMIT_BYTES) {
  const stat = fs.statSync(file);
  const size = Math.min(stat.size, maxBytes);
  const fd = fs.openSync(file, "r");
  const buffer = Buffer.alloc(size);

  try {
    fs.readSync(fd, buffer, 0, size, 0);
  } finally {
    fs.closeSync(fd);
  }

  return {
    file,
    sizeBytes: stat.size,
    readBytes: size,
    headerHexPreview: buffer.subarray(0, Math.min(32, buffer.length)).toString("hex"),
    headerAsciiPreview: buffer.subarray(0, Math.min(32, buffer.length)).toString("latin1").replace(/[^\x20-\x7E]/g, "."),
    headerSha256: sha256Buffer(buffer),
    readOnly: true,
    wroteFile: false,
    modifiedFixture: false
  };
}

function unsafeRealWriterClaim(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    obj.realKeyboardBinaryWriteAllowed === true ||
    obj.realWriterReady === true ||
    obj.realBinaryReady === true ||
    obj.realStyWriterReady === true ||
    obj.allowRealKeyboardBinaryOutput === true ||
    obj.allowRealStyOutput === true ||
    obj.canExportRealSty === true ||
    obj.canExportRealKeyboardBinary === true ||
    obj?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    obj?.finalDecision?.allowRealStyOutput === true ||
    obj?.finalDecision?.canExportRealSty === true ||
    obj?.finalDecision?.canExportRealKeyboardBinary === true
  );
}

export function loadR1FixtureReport(file = "generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_REPORT.json") {
  const report = readJson(file);
  if (!report) {
    return {
      exists: false,
      fixtures: [],
      warning: "R1 fixture report not found. R2-R6 can still generate empty safe reports."
    };
  }

  return {
    exists: true,
    fixtures: report.scans?.flatMap(scan => scan.fixtures || []) || [],
    source: file
  };
}

export function createR2ReadOnlyBinaryAnalyzer(input = {}) {
  const r1 = input.r1 || loadR1FixtureReport();
  const maxFiles = input.maxFiles || 50;
  const fixtures = (r1.fixtures || [])
    .filter(item => SUPPORTED_EXTENSIONS.includes(String(item.extension || "").toLowerCase()))
    .slice(0, maxFiles);

  const analyzed = [];

  for (const fixture of fixtures) {
    if (!fixture.fullPath || !exists(fixture.fullPath)) {
      analyzed.push({
        fileName: fixture.fileName,
        fullPath: fixture.fullPath,
        exists: false,
        ok: false,
        reason: "missing at analysis time"
      });
      continue;
    }

    try {
      analyzed.push({
        phase: "R2",
        fileName: fixture.fileName,
        fullPath: fixture.fullPath,
        extension: fixture.extension,
        targetHints: fixture.targetHints,
        exists: true,
        ok: true,
        ...safeReadHeader(fixture.fullPath)
      });
    } catch (error) {
      analyzed.push({
        phase: "R2",
        fileName: fixture.fileName,
        fullPath: fixture.fullPath,
        exists: true,
        ok: false,
        error: String(error?.message || error)
      });
    }
  }

  return {
    format: "UAOS_R2_READ_ONLY_BINARY_ANALYZER_REPORT",
    version: UAOS_R2_R6_VERSION,
    phase: "R2",
    status: "PASS",
    r1ReportExists: r1.exists,
    analyzedCount: analyzed.filter(x => x.ok).length,
    skippedOrFailedCount: analyzed.filter(x => !x.ok).length,
    maxReadBytesPerFile: SAFE_READ_LIMIT_BYTES,
    analyzed,
    safety: {
      readOnly: true,
      maxReadBytesPerFile: SAFE_READ_LIMIT_BYTES,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realKeyboardBinaryWriteAllowed: false,
      warning: "R2 reads only small file headers for user-owned fixtures indexed by R1."
    }
  };
}

export function createR3YamahaStyAnalyzer(r2Report) {
  const candidates = (r2Report.analyzed || []).filter(item =>
    item.ok &&
    String(item.extension || "").toLowerCase() === ".sty"
  );

  const yamahaCandidates = candidates.map(item => {
    const ascii = item.headerAsciiPreview || "";
    const hex = item.headerHexPreview || "";

    return {
      fileName: item.fileName,
      fullPath: item.fullPath,
      sizeBytes: item.sizeBytes,
      readBytes: item.readBytes,
      headerSha256: item.headerSha256,
      possibleYamahaSty: true,
      headerAsciiPreview: ascii,
      headerHexPreview: hex,
      detectedMarkers: {
        hasMidiLikeHeader: ascii.includes("MThd") || hex.startsWith("4d546864"),
        hasStyleLikeText: /sty|style/i.test(ascii)
      },
      readOnly: true,
      modifiedFixture: false
    };
  });

  return {
    format: "UAOS_R3_YAMAHA_STY_ANALYZER_REPORT",
    version: UAOS_R2_R6_VERSION,
    phase: "R3",
    status: "PASS",
    target: "yamaha",
    futureFormat: ".STY",
    candidateCount: yamahaCandidates.length,
    candidates: yamahaCandidates,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      readOnly: true,
      wroteRealSty: false,
      realBinaryBlocked: true,
      warning: "R3 analyzes Yamaha .STY candidates read-only. It does not write .STY files."
    }
  };
}

export function createR4RoundtripTestHarness(r3Report) {
  const tests = (r3Report.candidates || []).map(candidate => ({
    fileName: candidate.fileName,
    fullPath: candidate.fullPath,
    testName: "read-header-to-analysis-to-report",
    inputHash: candidate.headerSha256,
    outputHash: crypto.createHash("sha256").update(JSON.stringify({
      fileName: candidate.fileName,
      sizeBytes: candidate.sizeBytes,
      headerSha256: candidate.headerSha256
    })).digest("hex"),
    semanticRoundtripReady: false,
    binaryRoundtripReady: false,
    reason: "R4 creates harness placeholders only. True roundtrip requires validated parser and approved fixtures."
  }));

  return {
    format: "UAOS_R4_ROUNDTRIP_TEST_HARNESS_REPORT",
    version: UAOS_R2_R6_VERSION,
    phase: "R4",
    status: "PASS",
    target: "yamaha",
    testCount: tests.length,
    tests,
    semanticRoundtripReady: false,
    binaryRoundtripReady: false,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      readOnly: true,
      wroteRealSty: false,
      realBinaryBlocked: true,
      warning: "R4 prepares roundtrip harness metadata only."
    }
  };
}

export function createR5ChecksumChunkValidator(r3Report) {
  const validations = (r3Report.candidates || []).map(candidate => ({
    fileName: candidate.fileName,
    fullPath: candidate.fullPath,
    headerSha256: candidate.headerSha256,
    headerReadBytes: candidate.readBytes,
    checksumKnown: false,
    chunkRulesKnown: false,
    containerRulesKnown: false,
    safeHashAvailable: Boolean(candidate.headerSha256),
    validationStatus: "BLOCKED_UNTIL_FORMAT_RULES_KNOWN"
  }));

  return {
    format: "UAOS_R5_CHECKSUM_CHUNK_VALIDATOR_REPORT",
    version: UAOS_R2_R6_VERSION,
    phase: "R5",
    status: "PASS",
    target: "yamaha",
    validationCount: validations.length,
    validations,
    checksumWriterReady: false,
    chunkWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      readOnly: true,
      wroteRealSty: false,
      realBinaryBlocked: true,
      warning: "R5 records checksum/chunk validation blockers only. It does not infer or write proprietary rules."
    }
  };
}

export function createR6ExperimentalWriterGate(r2Report, r3Report, r4Report, r5Report) {
  const inputs = [r2Report, r3Report, r4Report, r5Report];
  const unsafe = inputs.some(unsafeRealWriterClaim);

  return {
    format: "UAOS_R6_EXPERIMENTAL_WRITER_GATE",
    version: UAOS_R2_R6_VERSION,
    phase: "R6",
    status: unsafe ? "FAIL" : "PASS",
    target: "yamaha",
    futureFormat: ".STY",
    inputs: inputs.map(item => ({
      phase: item.phase,
      format: item.format,
      status: item.status,
      unsafeRealWriterClaim: unsafeRealWriterClaim(item)
    })),
    readiness: {
      r2ReadOnlyAnalyzerReady: r2Report.status === "PASS",
      r3YamahaAnalyzerReady: r3Report.status === "PASS",
      r4RoundtripHarnessReady: r4Report.status === "PASS",
      r5ChecksumValidatorReady: r5Report.status === "PASS",
      experimentalWriterCanStart: false,
      realStyWriterReady: false,
      realKeyboardBinaryWriteAllowed: false
    },
    hardBlockers: [
      "full Yamaha .STY structure not validated",
      "full chunk/container parser not implemented",
      "checksum/package rules not validated",
      "semantic roundtrip parser not ready",
      "hardware/editor validation not complete",
      "explicit manual approval required before any writer"
    ],
    finalDecision: {
      allowExperimentalWriterImplementation: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      reason: "R6 keeps the writer locked. Validation is not sufficient to write a real .STY file."
    },
    safety: {
      realBinaryBlocked: true,
      wroteRealSty: false,
      warning: "R6 is a locked gate. It does not generate real keyboard binary output."
    }
  };
}

export function runR2R6ValidationProgram() {
  const r2 = createR2ReadOnlyBinaryAnalyzer();
  const r3 = createR3YamahaStyAnalyzer(r2);
  const r4 = createR4RoundtripTestHarness(r3);
  const r5 = createR5ChecksumChunkValidator(r3);
  const r6 = createR6ExperimentalWriterGate(r2, r3, r4, r5);

  return {
    format: "UAOS_R2_R6_VALIDATION_PROGRAM_REPORT",
    version: UAOS_R2_R6_VERSION,
    program: "Real Keyboard Binary Writer Validation Program",
    phases: ["R2", "R3", "R4", "R5", "R6"],
    status: r6.status,
    reports: { r2, r3, r4, r5, r6 },
    finalDecision: {
      validationProgramSafePass: r6.status === "PASS",
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateR2R6ValidationProgram(report) {
  const errors = [];

  if (report?.format !== "UAOS_R2_R6_VALIDATION_PROGRAM_REPORT") errors.push("Invalid R2-R6 report format.");
  if (report?.status !== "PASS") errors.push("R2-R6 status must be PASS.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.safety?.readOnly !== true) errors.push("Program must be read-only.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Program must not write keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");

  return { ok: errors.length === 0, errors };
}
