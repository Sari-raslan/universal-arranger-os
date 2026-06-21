import fs from "node:fs";

export const UAOS_PHASE81_90_VERSION = "81-90.0.0";

export const FINAL_REQUIRED_FILES = [
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_NEXT_ROADMAP.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_FINAL_QA_GATE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE_SUMMARY.json",
  "generated/real-exporter/device-tracks/korg-safe-track.json",
  "generated/real-exporter/device-tracks/roland-safe-track.json",
  "generated/real-exporter/device-tracks/ketron-safe-track.json"
];

function readArtifact(file) {
  if (!fs.existsSync(file)) {
    return {
      file,
      exists: false,
      ok: false,
      error: "missing"
    };
  }

  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));

    const unsafe = Boolean(
      data.realKeyboardBinaryWriteAllowed === true ||
      data.realWriterReady === true ||
      data.realBinaryReady === true ||
      data.realStyWriterReady === true ||
      data.allowRealKeyboardBinaryOutput === true ||
      data.allowRealStyOutput === true ||
      data.canExportRealSty === true ||
      data.canExportRealKeyboardBinary === true ||
      data?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
      data?.finalDecision?.realBinaryOutputAllowed === true ||
      data?.finalDecision?.allowRealStyOutput === true ||
      data?.finalDecision?.canExportRealSty === true ||
      data?.finalDecision?.canExportRealKeyboardBinary === true
    );

    return {
      file,
      exists: true,
      ok: !unsafe,
      format: data.format || "unknown",
      target: data.target || "global",
      unsafeRealBinaryClaim: unsafe,
      error: unsafe ? "unsafe real binary claim" : null
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

export function createUaosFinalClosurePack() {
  const artifactChecks = FINAL_REQUIRED_FILES.map(readArtifact);
  const failed = artifactChecks.filter((item) => !item.ok);

  return {
    format: "UAOS_FINAL_CLOSURE_PACK",
    version: UAOS_PHASE81_90_VERSION,
    phases: "81-90",
    status: failed.length === 0 ? "PASS" : "FAIL",

    project: {
      name: "UAOS",
      module: "Real Exporter Safe Foundation",
      localStatus: "SAFE_FOUNDATION_FINAL_CLOSED",
      productionStatus: "NOT_REAL_BINARY_EXPORTER_YET"
    },

    completedSafeTracks: [
      "Yamaha safe STY track through Phase 64",
      "KORG safe track through Phase 70",
      "Roland safe track through Phase 70",
      "Ketron safe track through Phase 70",
      "Real Exporter Safe Foundation through Phase 80"
    ],

    finalArtifacts: artifactChecks,

    finalDecision: {
      finalClosurePass: failed.length === 0,
      allowSafeJsonPackage: true,
      allowSafeUaosbinPackage: true,
      allowRealKeyboardBinaryOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      reason: "UAOS safe real-exporter foundation is closed locally. Real keyboard proprietary binary output remains blocked until validated writer program starts."
    },

    nextProgram: {
      name: "Real Keyboard Binary Writer Validation Program",
      firstRecommendedTarget: "Yamaha .STY",
      startsAfter: "fixture collection, binary analyzer, checksum validation, roundtrip import, editor/hardware validation"
    },

    safety: {
      realBinaryBlocked: true,
      blockedFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
      allowedFormats: [".json", ".uaosbin"],
      warning: "Final closure does not permit real proprietary keyboard binary export."
    }
  };
}

export function validateUaosFinalClosurePack(pack) {
  const errors = [];

  if (pack?.format !== "UAOS_FINAL_CLOSURE_PACK") errors.push("Invalid final closure format.");
  if (pack?.status !== "PASS") errors.push("Final closure status must be PASS.");
  if (pack?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (pack?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (pack?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (pack?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");
  if (!pack?.finalArtifacts?.length) errors.push("Missing final artifacts.");

  return { ok: errors.length === 0, errors };
}
