export const UAOS_PHASE71_VERSION = "71.0.0";

export function createRealExporterSafeReleaseManifest() {
  return {
    format: "UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST",
    version: UAOS_PHASE71_VERSION,
    phase: 71,
    packageName: "UAOS Real Exporter Safe Foundation",
    status: "SAFE_FOUNDATION_READY",
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    allowedOutputs: [".json", ".uaosbin"],
    blockedOutputs: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
    includedTracks: [
      {
        target: "yamaha",
        safeTrackStatus: "closed-through-phase-64",
        safeJsonPackage: true,
        safeUaosbinPackage: true,
        realOutputBlocked: [".STY"]
      },
      {
        target: "korg",
        safeTrackStatus: "safe-track-ready",
        safeJsonPackage: true,
        safeUaosbinPackage: true,
        realOutputBlocked: [".STY", ".SET"]
      },
      {
        target: "roland",
        safeTrackStatus: "safe-track-ready",
        safeJsonPackage: true,
        safeUaosbinPackage: true,
        realOutputBlocked: [".STL", ".PRS"]
      },
      {
        target: "ketron",
        safeTrackStatus: "safe-track-ready",
        safeJsonPackage: true,
        safeUaosbinPackage: true,
        realOutputBlocked: [".PAT", ".MSP", ".KST"]
      }
    ],
    requiredBeforeRealBinaryRelease: [
      "legal-safe official format research",
      "real fixture collection from user-owned files",
      "binary chunk analyzer",
      "checksum/package validator",
      "roundtrip import validation",
      "hardware/editor validation",
      "explicit release gate approval"
    ],
    finalDecision: {
      safeFoundationReady: true,
      allowSafeJsonPackage: true,
      allowSafeUaosbinPackage: true,
      allowRealKeyboardBinaryOutput: false,
      reason: "Safe foundation is complete. Proprietary keyboard binary writers remain blocked."
    },
    safety: {
      realBinaryBlocked: true,
      warning: "This release manifest does not permit real keyboard binary export."
    }
  };
}

export function validateRealExporterSafeReleaseManifest(manifest) {
  const errors = [];

  if (manifest?.format !== "UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST") errors.push("Invalid manifest format.");
  if (manifest?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real binary writing must be blocked.");
  if (manifest?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (manifest?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (manifest?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");
  if (!manifest?.includedTracks || manifest.includedTracks.length !== 4) errors.push("Expected 4 included tracks.");
  if (!manifest?.blockedOutputs?.length) errors.push("Missing blocked outputs.");

  return { ok: errors.length === 0, errors };
}
