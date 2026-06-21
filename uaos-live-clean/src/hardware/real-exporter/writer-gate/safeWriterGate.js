export const UAOS_PHASE55_VERSION = "55.0.0";

export const UAOS_WRITER_TARGETS = {
  korg: {
    target: "korg",
    blockedFormats: [".STY", ".SET"],
    allowedFormatsNow: [".json", ".uaosbin"],
    requiredGates: [
      "format analyzer complete",
      "section binary mapping complete",
      "legal-safe fixture validation",
      "checksum rules known",
      "roundtrip import test",
      "hardware/editor validation"
    ]
  },
  yamaha: {
    target: "yamaha",
    blockedFormats: [".STY"],
    allowedFormatsNow: [".json", ".uaosbin"],
    requiredGates: [
      "format analyzer complete",
      "section binary mapping complete",
      "legal-safe fixture validation",
      "CASM/OTS rules known",
      "roundtrip import test",
      "hardware/editor validation"
    ]
  },
  roland: {
    target: "roland",
    blockedFormats: [".STL", ".PRS"],
    allowedFormatsNow: [".json", ".uaosbin"],
    requiredGates: [
      "format analyzer complete",
      "section binary mapping complete",
      "legal-safe fixture validation",
      "performance metadata rules known",
      "roundtrip import test",
      "hardware/editor validation"
    ]
  },
  ketron: {
    target: "ketron",
    blockedFormats: [".PAT", ".MSP", ".KST"],
    allowedFormatsNow: [".json", ".uaosbin"],
    requiredGates: [
      "format analyzer complete",
      "section binary mapping complete",
      "legal-safe fixture validation",
      "audio drum reference rules known",
      "roundtrip import test",
      "hardware/editor validation"
    ]
  }
};

export function createSafeWriterGate(target, evidence = {}) {
  const config = UAOS_WRITER_TARGETS[target];
  if (!config) throw new Error(`Unknown writer target: ${target}`);

  const completed = Array.isArray(evidence.completedGates) ? evidence.completedGates : [];
  const missing = config.requiredGates.filter((gate) => !completed.includes(gate));

  return {
    format: "UAOS_SAFE_WRITER_GATE",
    version: UAOS_PHASE55_VERSION,
    target,
    allowedFormatsNow: config.allowedFormatsNow,
    blockedFormats: config.blockedFormats,
    requiredGates: config.requiredGates,
    completedGates: completed,
    missingGates: missing,
    realKeyboardBinaryWriteAllowed: false,
    safeIntermediateWriteAllowed: true,
    status: missing.length === 0 ? "READY_FOR_MANUAL_REVIEW_ONLY" : "BLOCKED",
    warning: "Phase 55 blocks real keyboard binary output. Only .json and .uaosbin are allowed now."
  };
}

export function validateSafeWriterGate(gate) {
  const errors = [];

  if (gate?.format !== "UAOS_SAFE_WRITER_GATE") errors.push("Invalid gate format.");
  if (!gate?.target) errors.push("Missing target.");
  if (gate?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (gate?.safeIntermediateWriteAllowed !== true) errors.push("Safe intermediate writing should be allowed.");
  if (!gate?.blockedFormats?.length) errors.push("Missing blocked formats.");
  if (!gate?.allowedFormatsNow?.includes(".json")) errors.push("JSON must be allowed.");
  if (!gate?.allowedFormatsNow?.includes(".uaosbin")) errors.push(".uaosbin must be allowed.");

  return { ok: errors.length === 0, errors };
}

export function createAllSafeWriterGates(evidence = {}) {
  return Object.keys(UAOS_WRITER_TARGETS).map((target) =>
    createSafeWriterGate(target, evidence[target] || {})
  );
}
