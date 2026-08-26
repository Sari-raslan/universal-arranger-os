/**
 * Canonical family adapter contract for UAOS Neutral IR conversion graph.
 * WRITE stays fail-closed unless capability flags + evidence allow it.
 */
import {
  familyFromExtension,
  inspectBuffer,
  normalizeMidiToIr,
  convertFromIr,
  proveMidiRoundtrip,
  canClaim,
  encodeMidiSmf
} from "./uaosNeutralIr.js";
import { enrichNeutralIr } from "../goldenBrain/goldenBrainCore.js";
import { buildArrangerNeutralIr, validateArrangerNeutralIr } from "./neutralIrArrangerSemantics.js";
import { detectFamilyWithEvidence } from "./familyDetection.js";
import { createVendorExtensions } from "./neutralIrPreservation.js";

export const ADAPTER_METHODS = Object.freeze([
  "detect",
  "inspect",
  "read",
  "toNeutralIR",
  "validateNeutralIR",
  "fromNeutralIR",
  "write",
  "verify",
  "roundtrip"
]);

export function createFamilyAdapter(familyId) {
  const family = String(familyId || "unknown").toLowerCase();
  const info = familyFromExtension(
    family === "midi" ? ".mid" : family === "sysex" ? ".syx" : family === "korg" ? ".set" : family === "yamaha" ? ".sty" : ".bin",
    family
  );

  const capabilities = {
    family: info.family,
    canDetect: true,
    canInspect: true,
    canRead: info.family === "midi",
    canNormalizeToIr: info.family === "midi",
    canWrite: false,
    canRoundtrip: info.family === "midi",
    requiresHardware: family === "sysex",
    requiresFormatContract: ["korg", "yamaha", "roland", "ketron", "unknown"].includes(info.family),
    maxProven: info.maxProven,
    support:
      info.family === "midi"
        ? "LIMITED_VERIFIED"
        : info.family === "sysex"
          ? "INSPECT_ONLY"
          : "FORMAT_CONTRACT_REQUIRED"
  };

  return {
    schema: "uaos.convert.family-adapter/v1",
    family: info.family,
    capabilities,
    detect(buffer, extension, brand) {
      return detectFamilyWithEvidence(buffer, extension, brand || family);
    },
    inspect(buffer, extension, brand) {
      return inspectBuffer(buffer, extension || ".bin", brand || family);
    },
    read(buffer, extension) {
      if (info.family !== "midi") {
        return { ok: false, errorCode: "READ_NOT_PROVEN", support: capabilities.support };
      }
      const ir = normalizeMidiToIr(buffer);
      return { ok: ir.ok, level: "READ", ir: ir.ir, errorCode: ir.errorCode };
    },
    toNeutralIR(bufferOrIr, extension) {
      if (bufferOrIr?.schema?.includes("neutral-ir") || bufferOrIr?.noteEvents) {
        const base = bufferOrIr.ir || bufferOrIr;
        const enriched = enrichNeutralIr(base);
        const arrangerIr = buildArrangerNeutralIr({
          midiIr: enriched.ir,
          golden: {
            capabilityId: enriched.ir.goldenBrain?.capabilityId,
            harmonyFamily: enriched.ir.goldenBrain?.harmonyFamily,
            detectedChord: enriched.ir.goldenBrain?.detectedChord,
            roles: enriched.ir.goldenBrain?.roles,
            intent: enriched.ir.goldenBrain?.intent,
            sections: enriched.ir.goldenBrain?.intent?.sections
          },
          opaqueVendor: base.vendorExtensions || base.opaqueVendor || null,
          sourceBuffer: Buffer.isBuffer(bufferOrIr) ? bufferOrIr : null,
          vendor: info.family,
          family: info.family
        });
        const v = validateArrangerNeutralIr(arrangerIr);
        return { ok: enriched.ok && v.ok, ir: arrangerIr };
      }
      if (info.family !== "midi") {
        const buf = Buffer.isBuffer(bufferOrIr) ? bufferOrIr : Buffer.alloc(0);
        const inspected = inspectBuffer(buf, extension || ".bin", family);
        const vendorExt = createVendorExtensions({
          vendor: info.family,
          family: info.family,
          buffer: buf,
          metadata: { strings: inspected.strings || [], hexPreview: inspected.hexPreview }
        });
        const arrangerIr = buildArrangerNeutralIr({
          midiIr: { family: info.family, noteEvents: [], ppq: 480 },
          golden: { sections: [] },
          opaqueVendor: vendorExt,
          sourceBuffer: buf,
          vendor: info.family,
          family: info.family
        });
        return {
          ok: true,
          ir: arrangerIr,
          lossy: true,
          LOSSY_CONVERSION: true,
          LOSS_REASON: "Proprietary binary not fully parsed; opaque passthrough only"
        };
      }
      const ir = normalizeMidiToIr(bufferOrIr);
      if (!ir.ok) return ir;
      return { ok: ir.ok, ir: ir.ir };
    },
    validateNeutralIR(ir) {
      if (!ir || !ir.schema?.includes("neutral-ir")) {
        return { ok: false, errorCode: "IR_SCHEMA_REQUIRED" };
      }
      if (ir.arrangerSemantics) {
        return validateArrangerNeutralIr(ir);
      }
      return { ok: true, family: ir.family || info.family };
    },
    fromNeutralIR(ir) {
      const claim = canClaim(info, "CONVERT_FROM_UAOS_IR");
      if (!claim.ok) {
        return {
          ok: false,
          errorCode: claim.errorCode || "FORMAT_CONTRACT_REQUIRED",
          support: capabilities.support
        };
      }
      return convertFromIr(ir);
    },
    write(irOrBytes) {
      return {
        ok: false,
        writeAttempted: false,
        writeAllowed: false,
        errorCode: capabilities.requiresFormatContract ? "FORMAT_CONTRACT_REQUIRED" : "WRITE_UNSUPPORTED",
        support: capabilities.support,
        family: info.family
      };
    },
    verify(buffer) {
      if (info.family === "midi") return proveMidiRoundtrip(buffer);
      return { ok: false, errorCode: "VERIFY_NOT_PROVEN", support: capabilities.support };
    },
    roundtrip(buffer) {
      if (info.family !== "midi") {
        return { ok: false, errorCode: "ROUNDTRIP_NOT_PROVEN", support: capabilities.support };
      }
      return proveMidiRoundtrip(buffer);
    }
  };
}

export function listKnownFamilies() {
  return ["midi", "sysex", "korg", "yamaha", "roland", "ketron", "unknown"].map((f) => createFamilyAdapter(f).capabilities);
}
