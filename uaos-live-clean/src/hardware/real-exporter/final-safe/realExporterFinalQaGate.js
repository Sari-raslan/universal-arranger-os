import fs from "node:fs";
import { createRealExporterMasterSafeIndex, validateRealExporterMasterSafeIndex } from "./realExporterMasterSafeIndex.js";

export const UAOS_PHASE68_VERSION = "68.0.0";

export function createRealExporterFinalQaGate() {
  const master = createRealExporterMasterSafeIndex();
  const valid = validateRealExporterMasterSafeIndex(master);

  const generatedFiles = [
    "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX.json",
    "generated/real-exporter/device-tracks/korg-safe-track.json",
    "generated/real-exporter/device-tracks/roland-safe-track.json",
    "generated/real-exporter/device-tracks/ketron-safe-track.json"
  ];

  const fileChecks = generatedFiles.map((file) => ({
    file,
    exists: fs.existsSync(file)
  }));

  const missing = fileChecks.filter((x) => !x.exists).map((x) => x.file);

  return {
    format: "UAOS_REAL_EXPORTER_FINAL_QA_GATE",
    version: UAOS_PHASE68_VERSION,
    phase: 68,
    status: valid.ok && missing.length === 0 ? "PASS" : "FAIL",
    masterIndexValid: valid.ok,
    masterIndexErrors: valid.errors,
    fileChecks,
    missing,
    finalDecision: {
      safeRealExporterFoundationPass: valid.ok && missing.length === 0,
      allowSafeJsonPackage: true,
      allowSafeUaosbinPackage: true,
      allowRealKeyboardBinaryOutput: false,
      canExportRealSty: false,
      canExportRealSet: false,
      canExportRealPrs: false,
      canExportRealStl: false,
      canExportRealPat: false,
      reason: "Final QA closes only the safe exporter foundation. Real keyboard proprietary binary writers are still blocked."
    },
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    safety: {
      realBinaryBlocked: true,
      warning: "Final QA gate validates safe artifacts only."
    }
  };
}

export function validateRealExporterFinalQaGate(gate) {
  const errors = [];

  if (gate?.format !== "UAOS_REAL_EXPORTER_FINAL_QA_GATE") errors.push("Invalid final QA format.");
  if (gate?.status !== "PASS") errors.push("Final QA must be PASS.");
  if (gate?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (gate?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (gate?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (gate?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");

  return { ok: errors.length === 0, errors };
}
