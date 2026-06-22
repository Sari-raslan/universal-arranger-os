export const KORG_SAFE_PREFIX_SCANNER = Object.freeze({
  gate: "KORG-REAL-PRODUCT-GATE-03-READ-ONLY-PREFIX-SCANNER",
  mode: "READ_ONLY_PREFIX_SCAN",
  writer: "FORBIDDEN",
  productionParser: "FORBIDDEN",
  realKeyboardOutput: "FORBIDDEN",
  maxPrefixBytes: 4096,
  allowedExtensions: [".sty", ".set", ".pcg", ".ksc", ".mid"],
});

function toHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(" ");
}

function toAsciiPreview(bytes) {
  return Array.from(bytes).map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : ".")).join("");
}

export function scanKorgPrefix(input = {}) {
  const name = String(input.name || "unknown");
  const size = Number(input.size || 0);
  const lower = name.toLowerCase();
  const extension = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  const raw = input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes || []);
  const prefix = raw.slice(0, KORG_SAFE_PREFIX_SCANNER.maxPrefixBytes);
  const risks = [];
  const allowed = KORG_SAFE_PREFIX_SCANNER.allowedExtensions.includes(extension);

  if (!allowed) risks.push("UNSUPPORTED_EXTENSION");
  if (size > KORG_SAFE_PREFIX_SCANNER.maxPrefixBytes) risks.push("PREFIX_ONLY_NOT_FULL_FILE");
  if (extension === ".set") risks.push("SET_PACKAGE_REQUIRES_FOLDER_BOUNDARY_GATE");
  if (extension === ".sty") risks.push("STYLE_FILE_REQUIRES_DEDICATED_READ_ONLY_PARSE_GATE");

  return {
    gate: KORG_SAFE_PREFIX_SCANNER.gate,
    mode: KORG_SAFE_PREFIX_SCANNER.mode,
    name,
    size,
    extension,
    allowed,
    prefixLength: prefix.length,
    hexPreview: toHex(prefix.slice(0, 32)),
    asciiPreview: toAsciiPreview(prefix.slice(0, 32)),
    writer: KORG_SAFE_PREFIX_SCANNER.writer,
    productionParser: KORG_SAFE_PREFIX_SCANNER.productionParser,
    realKeyboardOutput: KORG_SAFE_PREFIX_SCANNER.realKeyboardOutput,
    risks,
    saleStatus: "LOCKED",
  };
}
