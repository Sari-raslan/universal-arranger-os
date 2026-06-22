export const KORG_STRUCTURE_MAP_GATE = Object.freeze({
  gate: "KORG-REAL-PRODUCT-GATE-05-READ-ONLY-STYLE-STRUCTURE-MAP",
  mode: "READ_ONLY_STRUCTURE_MAP",
  sale: "LOCKED",
  writer: "FORBIDDEN",
  productionParser: "FORBIDDEN",
  realKeyboardOutput: "FORBIDDEN",
});

const STYLE_SECTIONS = ["intro", "variation", "fill", "break", "ending"];

export function inferKorgStyleStructure(scan = {}) {
  const ascii = String(scan.asciiPreview || "").toLowerCase();
  const hex = String(scan.hexPreview || "").toLowerCase();
  const extension = String(scan.extension || "").toLowerCase();
  const warnings = [];
  const sections = [];

  for (const section of STYLE_SECTIONS) {
    if (ascii.includes(section)) sections.push({ section, confidence: 0.7, source: "ascii-preview" });
  }

  if (extension === ".sty" && sections.length === 0) {
    sections.push({ section: "unknown-style-container", confidence: 0.25, source: "extension-only" });
    warnings.push("STRUCTURE_NOT_CONFIRMED_PREFIX_ONLY");
  }

  if (extension === ".set") warnings.push("SET_PACKAGE_STRUCTURE_REQUIRES_FOLDER_GATE");
  if (!hex && !ascii) warnings.push("NO_PREFIX_PREVIEW_AVAILABLE");
  if (Array.isArray(scan.risks)) warnings.push(...scan.risks);

  return {
    gate: KORG_STRUCTURE_MAP_GATE.gate,
    mode: KORG_STRUCTURE_MAP_GATE.mode,
    sale: KORG_STRUCTURE_MAP_GATE.sale,
    writer: KORG_STRUCTURE_MAP_GATE.writer,
    productionParser: KORG_STRUCTURE_MAP_GATE.productionParser,
    realKeyboardOutput: KORG_STRUCTURE_MAP_GATE.realKeyboardOutput,
    extension,
    prefixLength: Number(scan.prefixLength || 0),
    sections,
    warnings: Array.from(new Set(warnings)),
    commercialReady: false,
    decision: "READ_ONLY_STRUCTURE_MAP_ONLY_NOT_COMMERCIAL_READY",
    nextGate: "KORG-REAL-PRODUCT-GATE-06-READ-ONLY-COMPATIBILITY-MATRIX"
  };
}

export function summarizeKorgStructureMaps(scans = []) {
  const maps = scans.map(inferKorgStyleStructure);
  return {
    gate: KORG_STRUCTURE_MAP_GATE.gate,
    sale: "LOCKED",
    commercialReady: false,
    total: maps.length,
    maps,
  };
}
