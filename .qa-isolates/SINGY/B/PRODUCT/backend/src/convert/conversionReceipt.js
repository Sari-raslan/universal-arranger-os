/**
 * Conversion lossiness receipt — required for every conversion path.
 */
export function buildConversionReceipt({
  sourceFamily,
  targetFamily,
  lossless = false,
  preserved = [],
  mapped = [],
  substituted = [],
  dropped = [],
  unknown = [],
  lossReasons = [],
  confidence = "LOW",
  formatContractRequired = false,
  hardwareRequired = false,
  path = []
} = {}) {
  return {
    schema: "uaos.convert.receipt/v1",
    SOURCE_FAMILY: sourceFamily,
    TARGET_FAMILY: targetFamily,
    PATH: path,
    LOSSLESS: lossless ? "YES" : "NO",
    PRESERVED_FEATURES: preserved,
    MAPPED_FEATURES: mapped,
    SUBSTITUTED_FEATURES: substituted,
    DROPPED_FEATURES: dropped,
    UNKNOWN_FEATURES: unknown,
    LOSS_REASONS: lossReasons,
    CONFIDENCE: confidence,
    FORMAT_CONTRACT_REQUIRED: formatContractRequired ? "YES" : "NO",
    HARDWARE_REQUIRED: hardwareRequired ? "YES" : "NO",
    materialSemanticLoss: !lossless && (dropped.length > 0 || unknown.length > 0),
    successClaim: lossless || (dropped.length === 0 && !formatContractRequired)
  };
}

export function receiptFromConversionResult({ plan, toIr, write, sourceFamily, targetFamily }) {
  const lossless = sourceFamily === targetFamily && sourceFamily === "midi" && write?.ok === true;
  const preserved = ["noteEvents", "ppq", "tempoEvents"];
  const mapped = toIr?.ir?.arrangerSemantics ? ["arrangerSemantics", "sections", "trackRoles", "drumMapping"] : [];
  const dropped = [];
  const unknown = [];
  const lossReasons = [];

  if (toIr?.LOSSY_CONVERSION || toIr?.lossy) {
    lossReasons.push(toIr.LOSS_REASON || "PROPRIETARY_PARSE_INCOMPLETE");
    unknown.push("vendorOpaqueBlocks", "arrangerStyleParameters");
  }
  if (write?.ok === false) {
    dropped.push("targetProprietaryWrite");
    lossReasons.push(write.errorCode || "WRITE_FAIL_CLOSED");
  }
  if (toIr?.ir?.arrangerSemantics?.sysexPreserved?.length) {
    preserved.push("sysexOpaque");
  }

  return buildConversionReceipt({
    sourceFamily,
    targetFamily,
    lossless,
    preserved,
    mapped,
    substituted: write?.ok === false ? ["fail-closed-write-stub"] : [],
    dropped,
    unknown,
    lossReasons: [...new Set(lossReasons.filter(Boolean))],
    confidence: plan?.CONFIDENCE || "LOW",
    formatContractRequired: Boolean(plan?.FORMAT_CONTRACT_REQUIRED),
    hardwareRequired: Boolean(plan?.HARDWARE_REQUIRED),
    path: plan?.CONVERSION_PATH || []
  });
}
