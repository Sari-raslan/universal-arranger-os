import fs from "node:fs";

export const UAOS_PHASE64_VERSION = "64.0.0";

export const YAMAHA_PHASE64_REQUIRED_OUTPUTS = [
  "generated/real-exporter/yamaha-sty/yamaha-sty-writer-research-plan.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-intermediate-schema.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-phrase-event-schema.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-safe-container-plan.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-export-readiness-gate.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE.uaosbin",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_UAOSBIN_PACKAGE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_GATE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_SUMMARY.json"
];

function readArtifact(file) {
  if (!fs.existsSync(file)) {
    return { file, exists: false, ok: false, error: "missing" };
  }

  if (file.toLowerCase().endsWith(".uaosbin")) {
    const bytes = fs.readFileSync(file);
    const magic = bytes.subarray(0, 8).toString("utf8");
    return {
      file,
      exists: true,
      ok: magic === "UAOSBIN1",
      type: "uaosbin",
      magic,
      byteLength: bytes.length,
      error: magic === "UAOSBIN1" ? null : "bad uaosbin magic"
    };
  }

  try {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));

    const unsafe =
      json.realStyWriterReady === true ||
      json.realKeyboardBinaryWriteAllowed === true ||
      json.allowRealStyOutput === true ||
      json.canExportRealSty === true ||
      json.binaryContainerReady === true ||
      json?.finalDecision?.allowRealStyOutput === true ||
      json?.finalDecision?.canExportRealSty === true ||
      json?.readiness?.canGenerateRealStyNow === true;

    return {
      file,
      exists: true,
      ok: !unsafe,
      type: "json",
      format: json.format || "unknown",
      version: json.version || "unknown",
      unsafeRealStyClaim: unsafe,
      error: unsafe ? "unsafe real STY claim" : null
    };
  } catch (error) {
    return {
      file,
      exists: true,
      ok: false,
      type: "json",
      error: String(error?.message || error)
    };
  }
}

export function createYamahaStyTrackFinalLocalGate(requiredFiles = YAMAHA_PHASE64_REQUIRED_OUTPUTS) {
  const artifactChecks = requiredFiles.map(readArtifact);
  const failed = artifactChecks.filter((x) => !x.ok);

  return {
    format: "UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE",
    version: UAOS_PHASE64_VERSION,
    phase: 64,
    target: "yamaha",
    futureFormat: ".STY",

    status: failed.length === 0 ? "PASS" : "FAIL",
    requiredArtifactCount: requiredFiles.length,
    passedArtifactCount: artifactChecks.filter((x) => x.ok).length,
    failedArtifactCount: failed.length,
    artifactChecks,

    completedSafePipeline: [
      "Phase 56 Yamaha STY writer research track",
      "Phase 57 Yamaha STY intermediate schema",
      "Phase 58 Yamaha STY phrase event builder",
      "Phase 59 Yamaha STY safe container plan",
      "Phase 60 Yamaha STY export readiness gate",
      "Phase 61 Yamaha STY safe export package",
      "Phase 62 Yamaha STY safe UAOSBIN package",
      "Phase 63 Yamaha STY safe package QA gate"
    ],

    finalDecision: {
      localYamahaSafeTrackPass: failed.length === 0,
      allowSafeJsonPackage: failed.length === 0,
      allowSafeUaosbinPackage: failed.length === 0,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realStyWriterReady: false,
      reason: "Yamaha safe export track is complete locally, but real .STY binary output remains blocked until validated format rules, checksum rules, roundtrip import, and hardware/editor tests are complete."
    },

    nextRecommendedWork: [
      "collect legal-safe Yamaha style documentation",
      "create roundtrip test harness",
      "validate phrase chunk rules",
      "validate CASM-like rules",
      "validate OTS metadata",
      "validate checksum/package rules",
      "test in safe editor/hardware workflow"
    ],

    safety: {
      realBinaryBlocked: true,
      warning: "Phase 64 closes the safe Yamaha track only. It does not permit or generate real Yamaha .STY binary output."
    }
  };
}

export function validateYamahaStyTrackFinalLocalGate(gate) {
  const errors = [];

  if (gate?.format !== "UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE") errors.push("Invalid final local gate format.");
  if (gate?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (gate?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (gate?.status !== "PASS") errors.push("Final local gate must be PASS.");
  if (gate?.failedArtifactCount !== 0) errors.push("Failed artifacts must be zero.");
  if (gate?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must remain blocked.");
  if (gate?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (gate?.finalDecision?.realStyWriterReady !== false) errors.push("realStyWriterReady must be false.");
  if (gate?.safety?.realBinaryBlocked !== true) errors.push("Safety realBinaryBlocked must be true.");

  return { ok: errors.length === 0, errors };
}
