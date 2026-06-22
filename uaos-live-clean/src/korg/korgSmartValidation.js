export const KORG_SMART_VALIDATION = Object.freeze({
  gate: "KORG-REAL-PRODUCT-GATE-04-SMART-VALIDATION-DASHBOARD",
  mode: "READ_ONLY_SMART_VALIDATION",
  sale: "LOCKED",
  writer: "FORBIDDEN",
  productionParser: "FORBIDDEN",
  realKeyboardOutput: "FORBIDDEN",
});

export function validateKorgScan(scan = {}) {
  const risks = [];
  const warnings = [];
  const checks = [];

  checks.push({ id: "read_only_mode", pass: scan.mode === "READ_ONLY_PREFIX_SCAN" || scan.mode === "READ_ONLY_SCOPE_ONLY" });
  checks.push({ id: "writer_forbidden", pass: scan.writer === "FORBIDDEN" });
  checks.push({ id: "parser_forbidden", pass: scan.productionParser === "FORBIDDEN" });
  checks.push({ id: "output_forbidden", pass: scan.realKeyboardOutput === "FORBIDDEN" });
  checks.push({ id: "has_extension", pass: Boolean(scan.extension) });
  checks.push({ id: "has_prefix_preview", pass: Boolean(scan.hexPreview || scan.asciiPreview || scan.prefixLength >= 0) });

  if (!scan.allowed) risks.push("UNSUPPORTED_OR_UNVERIFIED_EXTENSION");
  if (Array.isArray(scan.risks)) {
    for (const risk of scan.risks) warnings.push(risk);
  }
  if (scan.extension === ".sty") warnings.push("STYLE_REQUIRES_DEDICATED_READ_ONLY_PARSE_GATE");
  if (scan.extension === ".set") warnings.push("SET_REQUIRES_PACKAGE_BOUNDARY_GATE");

  const failedChecks = checks.filter((x) => !x.pass);
  const score = Math.max(0, 100 - failedChecks.length * 20 - risks.length * 15 - warnings.length * 5);

  return {
    gate: KORG_SMART_VALIDATION.gate,
    mode: KORG_SMART_VALIDATION.mode,
    sale: KORG_SMART_VALIDATION.sale,
    writer: KORG_SMART_VALIDATION.writer,
    productionParser: KORG_SMART_VALIDATION.productionParser,
    realKeyboardOutput: KORG_SMART_VALIDATION.realKeyboardOutput,
    score,
    decision: failedChecks.length || risks.length ? "NOT_COMMERCIAL_READY" : "READ_ONLY_VALIDATION_OK",
    checks,
    failedChecks,
    risks,
    warnings,
    nextGate: "KORG-REAL-PRODUCT-GATE-05-READ-ONLY-STYLE-STRUCTURE-MAP"
  };
}

export function summarizeKorgValidation(items = []) {
  const validations = items.map(validateKorgScan);
  const ready = validations.filter((x) => x.decision === "READ_ONLY_VALIDATION_OK").length;
  const blocked = validations.length - ready;
  return {
    gate: KORG_SMART_VALIDATION.gate,
    sale: "LOCKED",
    total: validations.length,
    ready,
    blocked,
    commercialReady: false,
    validations,
  };
}
