import fs from "node:fs";

export const UAOS_R7_R10_VERSION = "R7-R10.0.0";

export const REQUIRED_VALIDATION_FILES = [
  "generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_REPORT.json",
  "generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_SUMMARY.json",
  "generated/real-writer-validation/r2-r6/UAOS_R2_READ_ONLY_BINARY_ANALYZER_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R3_YAMAHA_STY_ANALYZER_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R4_ROUNDTRIP_TEST_HARNESS_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R5_CHECKSUM_CHUNK_VALIDATOR_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R6_EXPERIMENTAL_WRITER_GATE.json",
  "generated/real-writer-validation/r2-r6/UAOS_R2_R6_VALIDATION_PROGRAM_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R2_R6_VALIDATION_PROGRAM_SUMMARY.json"
];

function readJsonSafe(file) {
  if (!fs.existsSync(file)) {
    return { file, exists: false, ok: false, error: "missing" };
  }

  try {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));

    const unsafe = Boolean(
      json.realKeyboardBinaryWriteAllowed === true ||
      json.realWriterReady === true ||
      json.realBinaryReady === true ||
      json.realStyWriterReady === true ||
      json.allowRealKeyboardBinaryOutput === true ||
      json.allowRealStyOutput === true ||
      json.canExportRealSty === true ||
      json.canExportRealKeyboardBinary === true ||
      json.wroteRealKeyboardBinary === true ||
      json.wroteRealSty === true ||
      json.copiedFiles === true ||
      json.modifiedFixtures === true ||
      json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
      json?.finalDecision?.allowRealStyOutput === true ||
      json?.finalDecision?.canExportRealSty === true ||
      json?.finalDecision?.canExportRealKeyboardBinary === true
    );

    return {
      file,
      exists: true,
      ok: !unsafe,
      format: json.format || "unknown",
      phase: json.phase || "unknown",
      unsafeRealWriterClaim: unsafe,
      error: unsafe ? "unsafe real writer claim" : null
    };
  } catch (error) {
    return {
      file,
      exists: true,
      ok: false,
      error: String(error?.message || error)
    };
  }
}

export function createRealWriterValidationFinalGate() {
  const checks = REQUIRED_VALIDATION_FILES.map(readJsonSafe);
  const failed = checks.filter((x) => !x.ok);

  return {
    format: "UAOS_REAL_WRITER_VALIDATION_FINAL_GATE",
    version: UAOS_R7_R10_VERSION,
    phases: ["R7", "R8", "R9", "R10"],
    status: failed.length === 0 ? "PASS" : "FAIL",

    program: {
      name: "Real Keyboard Binary Writer Validation Program",
      completed: ["R1 Fixture Collector", "R2 Read-only Binary Analyzer", "R3 Yamaha STY Analyzer", "R4 Roundtrip Harness", "R5 Checksum/Chunk Validator", "R6 Experimental Writer Gate Locked"],
      localStatus: "VALIDATION_PROGRAM_SAFE_BASELINE_READY",
      productionStatus: "NO_REAL_BINARY_WRITER_RELEASED"
    },

    checks,
    requiredFileCount: REQUIRED_VALIDATION_FILES.length,
    passedFileCount: checks.filter((x) => x.ok).length,
    failedFileCount: failed.length,

    finalDecision: {
      validationBaselineReady: failed.length === 0,
      allowReadOnlyAnalysis: true,
      allowFixtureMetadataIndex: true,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      reason: "R1-R6 validation baseline is ready, but real keyboard binary writing remains blocked."
    },

    nextRecommendedWork: {
      id: "R11",
      name: "User-approved fixture target selection",
      description: "Choose a small set of user-owned Yamaha .STY files for deeper read-only analysis."
    },

    safety: {
      readOnlyBaseline: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true,
      blockedFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
      warning: "Final validation gate does not permit real proprietary keyboard binary export."
    }
  };
}

export function validateRealWriterValidationFinalGate(gate) {
  const errors = [];

  if (gate?.format !== "UAOS_REAL_WRITER_VALIDATION_FINAL_GATE") errors.push("Invalid final gate format.");
  if (gate?.status !== "PASS") errors.push("Final gate status must be PASS.");
  if (gate?.failedFileCount !== 0) errors.push("Failed file count must be zero.");
  if (gate?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (gate?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (gate?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (gate?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (gate?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write keyboard binary.");
  if (gate?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");

  return { ok: errors.length === 0, errors };
}
