/**
 * Conversion graph: SOURCE → Neutral IR (+ Golden Brain) → TARGET
 * No NxN proprietary converter engines.
 */
import { createFamilyAdapter, listKnownFamilies } from "./familyAdapterContract.js";
import { encodeMidiSmf } from "./uaosNeutralIr.js";
import { receiptFromConversionResult } from "./conversionReceipt.js";

export function planConversion({ sourceFamily, targetFamily }) {
  const source = createFamilyAdapter(sourceFamily);
  const target = createFamilyAdapter(targetFamily);
  const formatContractRequired =
    source.capabilities.requiresFormatContract || target.capabilities.requiresFormatContract;
  const hardwareRequired = source.capabilities.requiresHardware || target.capabilities.requiresHardware;
  const canExecuteReadPath = source.capabilities.canInspect || source.capabilities.canRead;
  const canWriteTarget = target.capabilities.canWrite === true;
  let confidence = "LOW";
  if (sourceFamily === "midi" && targetFamily === "midi") confidence = "HIGH";
  else if (sourceFamily === "midi" && !canWriteTarget) confidence = "MEDIUM_INSPECT_ONLY_TARGET";
  else if (!canWriteTarget) confidence = "LOW_FORMAT_CONTRACT";

  return {
    schema: "uaos.convert.conversion-path/v1",
    ok: canExecuteReadPath,
    CONVERSION_PATH: [
      `adapter:${source.family}.detect/inspect/toNeutralIR`,
      "goldenBrain.enrichNeutralIr",
      `adapter:${target.family}.validateNeutralIR/fromNeutralIR/write`
    ],
    CONFIDENCE: confidence,
    LOSSINESS: sourceFamily === targetFamily && sourceFamily === "midi" ? "LOSSLESS_EVENTS_WHERE_PROVEN" : "LOSSY_OR_OPAQUE",
    HARDWARE_REQUIRED: hardwareRequired,
    FORMAT_CONTRACT_REQUIRED: formatContractRequired,
    source: source.capabilities,
    target: target.capabilities,
    writeAllowed: canWriteTarget
  };
}

export function runConversion({
  sourceFamily = "midi",
  targetFamily = "midi",
  bytes,
  extension,
  brand
} = {}) {
  const plan = planConversion({ sourceFamily, targetFamily });
  const source = createFamilyAdapter(sourceFamily);
  const target = createFamilyAdapter(targetFamily);
  const detected = source.detect(bytes, extension, brand);
  const toIr = source.toNeutralIR(
    bytes || encodeMidiSmf({ noteEvents: [{ midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 }] }),
    extension
  );
  if (!toIr.ok && toIr.ok !== true) {
    return { ok: false, plan, errorCode: toIr.errorCode || "TO_IR_FAILED" };
  }
  const ir = toIr.ir || toIr;
  const validated = target.validateNeutralIR(ir);
  const fromIr = target.fromNeutralIR(ir);
  const write = target.write(fromIr.bytes || ir);
  const receipt = receiptFromConversionResult({ plan, toIr, write, sourceFamily, targetFamily });
  return {
    ok: plan.ok && validated.ok,
    plan,
    detected,
    ir,
    fromIr,
    write,
    receipt,
    LOSSY_CONVERSION: receipt.LOSSLESS !== "YES",
    LOSS_REASON: receipt.LOSS_REASONS[0] || (write.ok ? null : write.errorCode),
    PRESERVED_INFORMATION: receipt.PRESERVED_FEATURES,
    DROPPED_INFORMATION: receipt.DROPPED_FEATURES,
    SUBSTITUTION: receipt.SUBSTITUTED_FEATURES.length ? receipt.SUBSTITUTED_FEATURES.join(",") : null,
    musicalQualityClaim: false
  };
}

export function conversionGraphStatus() {
  const families = listKnownFamilies();
  return {
    schema: "uaos.convert.conversion-graph-status/v1",
    ok: true,
    families,
    nByNHardcodedConverters: 0,
    backbone: "Neutral IR + Golden Brain enrich + family adapters",
    writeVerifiedFamilies: families.filter((f) => f.canWrite).map((f) => f.family),
    inspectOnly: families.filter((f) => f.support === "INSPECT_ONLY" || f.support === "FORMAT_CONTRACT_REQUIRED").map((f) => f.family)
  };
}
