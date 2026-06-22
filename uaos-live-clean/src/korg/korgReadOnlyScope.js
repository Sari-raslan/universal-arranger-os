export const KORG_READ_ONLY_SCOPE = Object.freeze({
  gate: "KORG-REAL-PRODUCT-GATE-02-READ-ONLY-READER-SCOPE",
  mode: "READ_ONLY_SCOPE_ONLY",
  commercialSale: "LOCKED",
  writer: "FORBIDDEN",
  productionParser: "FORBIDDEN",
  realKeyboardOutput: "FORBIDDEN",
  allowedExtensions: [".sty", ".set", ".pcg", ".ksc", ".mid"],
  blockedOutputExtensions: [".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"],
  maxScanBytes: 262144,
  allowedOperations: [
    "file_name_inspection",
    "extension_check",
    "size_check",
    "safe_prefix_read_design",
    "header_hex_preview_design",
    "risk_classification_design",
    "report_generation"
  ],
  forbiddenOperations: [
    "write_keyboard_file",
    "modify_fixture",
    "modify_user_style",
    "production_parse",
    "export_real_korg_package",
    "claim_device_compatibility"
  ],
});

export function classifyKorgCandidate(fileMeta = {}) {
  const name = String(fileMeta.name || "");
  const size = Number(fileMeta.size || 0);
  const lower = name.toLowerCase();
  const extension = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  const isAllowedExtension = KORG_READ_ONLY_SCOPE.allowedExtensions.includes(extension);
  const isBlockedOutputExtension = KORG_READ_ONLY_SCOPE.blockedOutputExtensions.includes(extension);
  const withinScanLimit = size >= 0 && size <= KORG_READ_ONLY_SCOPE.maxScanBytes;

  let status = "NOT_KORG_CANDIDATE";
  const risks = [];

  if (isAllowedExtension) status = "READ_ONLY_CANDIDATE";
  if (!withinScanLimit) risks.push("FILE_EXCEEDS_SAFE_PREFIX_SCAN_LIMIT");
  if (isBlockedOutputExtension) risks.push("OUTPUT_EXTENSION_IS_BLOCKED_FOR_WRITING");
  if (extension === ".set") risks.push("SET_PACKAGE_REQUIRES_SPECIAL_READ_ONLY_BOUNDARY");
  if (extension === ".sty") risks.push("STYLE_FILE_REQUIRES_DEDICATED_PARSER_GATE");

  return {
    gate: KORG_READ_ONLY_SCOPE.gate,
    mode: KORG_READ_ONLY_SCOPE.mode,
    name,
    size,
    extension,
    isAllowedExtension,
    withinScanLimit,
    status,
    saleStatus: KORG_READ_ONLY_SCOPE.commercialSale,
    writer: KORG_READ_ONLY_SCOPE.writer,
    productionParser: KORG_READ_ONLY_SCOPE.productionParser,
    risks,
  };
}

export function getKorgReadOnlyScopeReport() {
  return {
    ...KORG_READ_ONLY_SCOPE,
    result: "SCOPE_DEFINED_NOT_PRODUCT_READY",
    nextGate: "KORG-REAL-PRODUCT-GATE-03-READ-ONLY-PREFIX-SCANNER",
  };
}
