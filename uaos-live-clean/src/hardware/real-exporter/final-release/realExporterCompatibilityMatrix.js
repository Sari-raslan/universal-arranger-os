export const UAOS_PHASE72_VERSION = "72.0.0";

export function createRealExporterCompatibilityMatrix() {
  return {
    format: "UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX",
    version: UAOS_PHASE72_VERSION,
    phase: 72,
    realKeyboardBinaryWriteAllowed: false,
    devices: [
      {
        brand: "Yamaha",
        models: ["Genos", "Tyros family research", "PSR-S/SX family research"],
        futureFormats: [".STY"],
        safeJsonReady: true,
        safeUaosbinReady: true,
        realBinaryReady: false,
        validationRequired: ["STY chunks", "CASM-like rules", "OTS metadata", "checksum", "roundtrip"]
      },
      {
        brand: "KORG",
        models: ["PA3X Oriental", "PA5X", "PA family research"],
        futureFormats: [".STY", ".SET"],
        safeJsonReady: true,
        safeUaosbinReady: true,
        realBinaryReady: false,
        validationRequired: ["style container", "SET package", "sections", "metadata", "hardware editor"]
      },
      {
        brand: "Roland",
        models: ["BK-9", "E-A family research"],
        futureFormats: [".STL", ".PRS"],
        safeJsonReady: true,
        safeUaosbinReady: true,
        realBinaryReady: false,
        validationRequired: ["style/performance structure", "device family map", "package rules"]
      },
      {
        brand: "Ketron",
        models: ["SD9", "Audya family research"],
        futureFormats: [".PAT", ".MSP", ".KST"],
        safeJsonReady: true,
        safeUaosbinReady: true,
        realBinaryReady: false,
        validationRequired: ["PAT/MSP/KST package", "audio drum refs", "phrase metadata", "hardware validation"]
      }
    ],
    finalDecision: {
      compatibilityMatrixReady: true,
      realBinaryOutputAllowed: false,
      reason: "Compatibility matrix documents safe readiness only. Real binary validation is still required."
    },
    safety: {
      realBinaryBlocked: true,
      warning: "Compatibility does not mean real proprietary binary writer readiness."
    }
  };
}

export function validateRealExporterCompatibilityMatrix(matrix) {
  const errors = [];

  if (matrix?.format !== "UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX") errors.push("Invalid matrix format.");
  if (matrix?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real binary writing must be blocked.");
  if (!matrix?.devices || matrix.devices.length !== 4) errors.push("Expected 4 device groups.");
  if (!matrix?.devices?.every(d => d.safeJsonReady === true)) errors.push("All devices must have safe JSON ready.");
  if (!matrix?.devices?.every(d => d.safeUaosbinReady === true)) errors.push("All devices must have safe UAOSBIN ready.");
  if (!matrix?.devices?.every(d => d.realBinaryReady === false)) errors.push("All devices must keep realBinaryReady false.");
  if (matrix?.finalDecision?.realBinaryOutputAllowed !== false) errors.push("Real binary output must be blocked.");
  if (matrix?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");

  return { ok: errors.length === 0, errors };
}
