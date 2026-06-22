export const KORG_COMPATIBILITY_GATE = Object.freeze({
  gate: "KORG-REAL-PRODUCT-GATE-06-READ-ONLY-COMPATIBILITY-MATRIX",
  mode: "READ_ONLY_COMPATIBILITY_MATRIX",
  sale: "LOCKED",
  writer: "FORBIDDEN",
  productionParser: "FORBIDDEN",
  realKeyboardOutput: "FORBIDDEN",
});

export const KORG_DEVICE_PROFILES = Object.freeze({
  PA3X: { family: "PA", generation: "legacy", styleSupport: "requires-real-validation", exportAllowed: false },
  PA4X: { family: "PA", generation: "modern", styleSupport: "requires-real-validation", exportAllowed: false },
  PA5X: { family: "PA", generation: "current", styleSupport: "requires-real-validation", exportAllowed: false }
});

export function evaluateKorgCompatibility(structureMap = {}, target = "PA3X") {
  const profile = KORG_DEVICE_PROFILES[target] || KORG_DEVICE_PROFILES.PA3X;
  const warnings = [];
  if (!structureMap || !Array.isArray(structureMap.sections)) warnings.push("NO_STRUCTURE_MAP");
  if (structureMap?.warnings?.length) warnings.push(...structureMap.warnings);
  if (!profile.exportAllowed) warnings.push("REAL_EXPORT_BLOCKED_UNTIL_WRITER_GATE");
  const sectionCount = Array.isArray(structureMap.sections) ? structureMap.sections.length : 0;
  return {
    gate: KORG_COMPATIBILITY_GATE.gate,
    mode: KORG_COMPATIBILITY_GATE.mode,
    target,
    profile,
    sale: KORG_COMPATIBILITY_GATE.sale,
    writer: KORG_COMPATIBILITY_GATE.writer,
    productionParser: KORG_COMPATIBILITY_GATE.productionParser,
    realKeyboardOutput: KORG_COMPATIBILITY_GATE.realKeyboardOutput,
    sectionCount,
    confidence: sectionCount > 0 ? "READ_ONLY_LOW_TO_MEDIUM" : "LOW",
    commercialReady: false,
    decision: "NOT_COMMERCIAL_READY_COMPATIBILITY_NEEDS_REAL_DEVICE_OR_APPROVED_FIXTURE",
    warnings: Array.from(new Set(warnings)),
    nextGate: "KORG-REAL-PRODUCT-GATE-07-DEVICE-DIAGNOSTIC-PROOF"
  };
}
