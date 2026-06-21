import fs from "node:fs";

export const UAOS_PHASE60_VERSION = "60.0.0";

export function createYamahaStyExportReadinessGate(input = {}) {
  const requiredFiles = input.requiredFiles || [
    "generated/real-exporter/yamaha-sty/yamaha-sty-writer-research-plan.json",
    "generated/real-exporter/yamaha-sty/yamaha-sty-intermediate-schema.json",
    "generated/real-exporter/yamaha-sty/yamaha-sty-phrase-event-schema.json",
    "generated/real-exporter/yamaha-sty/yamaha-sty-safe-container-plan.json"
  ];

  const fileChecks = requiredFiles.map((file) => ({
    file,
    exists: fs.existsSync(file)
  }));

  const completedSafeStages = fileChecks.filter((x) => x.exists).map((x) => x.file);

  const hardBlockers = [
    "real Yamaha STY binary container structure not validated",
    "CASM-like rules not validated",
    "OTS metadata not validated",
    "checksum/package rules not validated",
    "roundtrip import test not completed",
    "hardware/editor validation not completed",
    "legal-safe writer rules not approved"
  ];

  return {
    format: "UAOS_YAMAHA_STY_EXPORT_READINESS_GATE",
    version: UAOS_PHASE60_VERSION,
    phase: 60,
    target: "yamaha",
    futureFormat: ".STY",

    safeStagesChecked: requiredFiles.length,
    safeStagesCompleted: completedSafeStages.length,
    fileChecks,

    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    safeJsonExportAllowed: true,
    safeUaosbinExportAllowed: true,

    readiness: {
      status: "NOT_READY_FOR_REAL_STY",
      canGenerateRealStyNow: false,
      canGenerateSafePlanNow: true,
      completedSafeStages,
      hardBlockers
    },

    finalDecision: {
      allowRealStyOutput: false,
      allowJsonOutput: true,
      allowUaosbinOutput: true,
      reason: "Safe research pipeline exists, but real Yamaha STY binary validation is not complete."
    },

    safety: {
      realBinaryBlocked: true,
      warning: "Phase 60 is a readiness gate only. It must not generate a Yamaha .STY file."
    }
  };
}

export function validateYamahaStyExportReadinessGate(gate) {
  const errors = [];

  if (gate?.format !== "UAOS_YAMAHA_STY_EXPORT_READINESS_GATE") errors.push("Invalid readiness gate format.");
  if (gate?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (gate?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (gate?.realStyWriterReady !== false) errors.push("Must not claim real STY writer ready.");
  if (gate?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (gate?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must not be allowed.");
  if (gate?.readiness?.canGenerateRealStyNow !== false) errors.push("canGenerateRealStyNow must be false.");
  if (gate?.safety?.realBinaryBlocked !== true) errors.push("Safety realBinaryBlocked must be true.");
  if (!gate?.readiness?.hardBlockers?.length) errors.push("Missing hard blockers.");

  return { ok: errors.length === 0, errors };
}
