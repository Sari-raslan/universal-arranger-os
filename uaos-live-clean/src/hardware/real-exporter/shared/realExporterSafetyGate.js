export const UAOS_REAL_EXPORTER_SAFETY_VERSION = "51.0.0";

export function createRealExporterSafetyGate(input = {}) {
  return {
    format: "UAOS_REAL_EXPORTER_SAFETY_GATE",
    version: UAOS_REAL_EXPORTER_SAFETY_VERSION,
    target: input.target || "unknown",
    realBinaryWriterReady: false,
    allowedOutputNow: [".uaosbin", ".json"],
    blockedOutputUntilValidated: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
    requiredBeforeRealBinary: [
      "legal format review",
      "device-specific binary structure documentation",
      "golden input fixtures",
      "golden output fixtures",
      "roundtrip import validation",
      "hardware/editor validation",
      "checksum/container rules",
      "user warning and compatibility matrix"
    ],
    warning: "Phase 51 creates real exporter scaffolds only. It must not generate proprietary keyboard binary files yet."
  };
}

export function assertNoRealBinaryClaim(gate) {
  if (!gate) throw new Error("Safety gate missing.");
  if (gate.realBinaryWriterReady !== false) {
    throw new Error("Unsafe claim: realBinaryWriterReady must be false.");
  }
  return true;
}
