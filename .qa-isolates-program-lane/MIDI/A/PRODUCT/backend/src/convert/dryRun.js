/**
 * Converter dry-run — simulate conversion outcomes without writing proprietary files.
 */
import {
  encodeMidiSmf,
  normalizeMidiToIr,
  convertFromIr,
  proveMidiRoundtrip,
  inspectBuffer,
  canClaim,
  familyFromExtension,
  familySupportMatrix
} from "./uaosNeutralIr.js";
import { inspectSysex } from "./familyAdapters.js";
import crypto from "node:crypto";

function resolveFamilyInfo(opts = {}) {
  if (opts.family) {
    const key = String(opts.family).toLowerCase();
    const extMap = {
      midi: ".mid",
      sysex: ".syx",
      korg: ".set",
      yamaha: ".sty",
      roland: ".bin",
      ketron: ".bin",
      unknown: ".bin"
    };
    return familyFromExtension(extMap[key] || ".bin", key);
  }
  return familyFromExtension(opts.extension || ".mid", opts.brand || "unknown");
}

/**
 * @param {{ family?: string, extension?: string, brand?: string, bytes?: Buffer, noteEvents?: object[] }} opts
 */
export function runConverterDryRun(opts = {}) {
  const familyInfo = resolveFamilyInfo(opts);
  const family = familyInfo.family;
  const writeClaim = canClaim(familyInfo, "WRITE");
  const matrix = familySupportMatrix();
  const row = matrix.find((m) => m.family === family) || null;

  const notes =
    opts.noteEvents ||
    [
      { midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 },
      { midi: 64, startTick: 480, durationTicks: 480, velocity: 80, channel: 0 }
    ];

  const midiBytes = opts.bytes && Buffer.isBuffer(opts.bytes) ? opts.bytes : encodeMidiSmf({ noteEvents: notes });
  const ir = family === "midi" ? normalizeMidiToIr(midiBytes) : { ok: false, errorCode: "NOT_MIDI" };
  const roundtrip = family === "midi" ? proveMidiRoundtrip(midiBytes) : { ok: false, level: "NOT_APPLICABLE" };
  const fromIr = family === "midi" && ir.ok ? convertFromIr(ir.ir) : { ok: false, errorCode: "FORMAT_CONTRACT_REQUIRED" };

  let inspect = null;
  if (family === "sysex") {
    inspect = inspectSysex(opts.bytes || Buffer.from([0xf0, 0x42, 0x00, 0xf7]));
  } else if (["korg", "yamaha", "roland", "ketron", "unknown"].includes(family)) {
    inspect = inspectBuffer(opts.bytes || Buffer.from(family.toUpperCase()), opts.extension || ".bin", family);
  } else if (family === "midi") {
    inspect = inspectBuffer(midiBytes, ".mid", "midi");
  }

  const wouldWrite = Boolean(writeClaim.ok);
  const result = {
    schema: "uaos.converter.dry-run/v1",
    ok: true,
    dryRun: true,
    family,
    matrixRow: row,
    writeAllowed: wouldWrite,
    writeBlockedReason: wouldWrite ? null : writeClaim.errorCode || row?.gate || "FORMAT_CONTRACT_REQUIRED",
    simulatedWritePerformed: false,
    inspect,
    irOk: ir.ok === true,
    roundtripOk: roundtrip.ok === true,
    convertFromIrOk: fromIr.ok === true,
    receiptSha256: crypto
      .createHash("sha256")
      .update(JSON.stringify({ family, irOk: ir.ok, roundtrip: roundtrip.ok, write: wouldWrite }))
      .digest("hex"),
    musicalQualityClaim: false
  };

  // Fail closed if a proprietary write would have been attempted
  if (wouldWrite && family !== "midi") {
    return { ...result, ok: false, errorCode: "UNEXPECTED_WRITE_ALLOWANCE" };
  }
  return result;
}

export function runConverterDryRunSuite() {
  const families = ["midi", "sysex", "korg", "yamaha", "roland", "ketron"];
  const results = families.map((family) => runConverterDryRun({ family }));
  const fail = results.filter((r) => !r.ok);
  const proprietaryWrites = results.filter((r) => r.family !== "midi" && r.simulatedWritePerformed);
  return {
    ok: fail.length === 0 && proprietaryWrites.length === 0,
    total: results.length,
    pass: results.length - fail.length,
    results,
    summarySha256: crypto.createHash("sha256").update(JSON.stringify(results.map((r) => r.receiptSha256))).digest("hex")
  };
}
