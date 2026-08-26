/**
 * One conversion engine + family adapters + UAOS Neutral IR.
 * Levels never jump without proof. Proprietary write stays FORMAT_CONTRACT_REQUIRED.
 */
import { parseMidiSmf, encodeMidiSmf, roundtripMidiPitches } from "./midiSmfAdapter.js";
import { inspectSysex, familySupportMatrix } from "./familyAdapters.js";

export const SUPPORT_LEVELS = Object.freeze([
  "DISCOVERED",
  "INSPECT",
  "READ",
  "NORMALIZE_TO_UAOS_IR",
  "CONVERT_FROM_UAOS_IR",
  "WRITE",
  "ROUNDTRIP_VERIFIED",
  "HARDWARE_VERIFIED"
]);

const FAMILIES = {
  midi: { family: "midi", maxProven: "ROUNDTRIP_VERIFIED", write: false, note: "SMF in-memory roundtrip only. File/hardware write not claimed." },
  sysex: { family: "sysex", maxProven: "INSPECT", write: false, note: "SysEx inspect only. Hardware write unsupported." },
  korg: { family: "korg", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" },
  yamaha: { family: "yamaha", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" },
  roland: { family: "roland", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" },
  ketron: { family: "ketron", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" },
  unknown: { family: "unknown", maxProven: "INSPECT", write: false, gate: "FORMAT_CONTRACT_REQUIRED" }
};

function rank(level) {
  return SUPPORT_LEVELS.indexOf(level);
}

export function familyFromExtension(extension, brand = "unknown") {
  const ext = String(extension || "").toLowerCase();
  if (ext === ".mid" || ext === ".midi") return FAMILIES.midi;
  if (ext === ".syx") return FAMILIES.sysex;
  const b = String(brand || "unknown").toLowerCase();
  if (b.includes("korg") || ext === ".set" || ext === ".pcg") return FAMILIES.korg;
  if (b.includes("yamaha") || ext === ".sty") return FAMILIES.yamaha;
  if (b.includes("roland")) return FAMILIES.roland;
  if (b.includes("ketron")) return FAMILIES.ketron;
  if ([".kst", ".pad", ".prs", ".all", ".bkp", ".pkg"].includes(ext)) return FAMILIES.unknown;
  return FAMILIES.unknown;
}

export function canClaim(familyInfo, requestedLevel) {
  if (!SUPPORT_LEVELS.includes(requestedLevel)) return { ok: false, errorCode: "UNKNOWN_LEVEL" };
  if (rank(requestedLevel) > rank(familyInfo.maxProven)) {
    return {
      ok: false,
      errorCode: familyInfo.gate || "LEVEL_NOT_PROVEN",
      family: familyInfo.family,
      requestedLevel,
      maxProven: familyInfo.maxProven
    };
  }
  if ((requestedLevel === "WRITE" || requestedLevel === "HARDWARE_VERIFIED") && !familyInfo.write) {
    return { ok: false, errorCode: "KORG_WRITE_UNSUPPORTED", family: familyInfo.family, note: familyInfo.note };
  }
  return { ok: true, family: familyInfo.family, level: requestedLevel };
}

function extractStrings(buffer) {
  const text = Buffer.isBuffer(buffer) ? buffer.toString("latin1").replace(/[^\x20-\x7e]+/g, "\n") : "";
  return [...new Set(text.split("\n").map((s) => s.trim()).filter((s) => s.length >= 4))].slice(0, 40);
}

export function inspectBuffer(buffer, extension, brand) {
  const family = familyFromExtension(extension, brand);
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.alloc(0);
  if (family.family === "midi") {
    const parsed = parseMidiSmf(buf);
    return {
      ok: parsed.ok,
      level: parsed.ok ? "READ" : "INSPECT",
      family: "midi",
      parsed,
      hexPreview: buf.subarray(0, 64).toString("hex"),
      musicalQualityClaim: false
    };
  }
  if (family.family === "sysex") {
    return inspectSysex(buf);
  }
  return {
    ok: true,
    level: "INSPECT",
    family: family.family,
    hexPreview: buf.subarray(0, 64).toString("hex"),
    strings: extractStrings(buf),
    proprietary: true,
    deepParserNeeded: true,
    write: "FORMAT_CONTRACT_REQUIRED",
    musicalQualityClaim: false
  };
}

export function normalizeMidiToIr(midiOrBuffer) {
  const parsed = Buffer.isBuffer(midiOrBuffer)
    ? parseMidiSmf(midiOrBuffer)
    : midiOrBuffer;
  if (!parsed?.validHeader && !parsed?.ok) return { ok: false, errorCode: "NOT_MIDI" };
  if (parsed.ok === false) return parsed;
  const noteEvents = Array.isArray(parsed.noteEvents) ? parsed.noteEvents : [];
  return {
    ok: true,
    ir: {
      schema: "uaos.neutral-ir/v1",
      family: "midi",
      tempoEvents: parsed.tempoEvents,
      notes: typeof parsed.notes === "number" ? parsed.notes : noteEvents.length,
      noteEvents,
      controllers: parsed.controllers,
      programChanges: parsed.programChanges,
      ppq: parsed.ppq || 480,
      musicalQualityClaim: false
    },
    level: "NORMALIZE_TO_UAOS_IR"
  };
}

export function convertFromIr(ir, family = ir?.family) {
  const fam = familyFromExtension(family === "midi" ? ".mid" : "", family);
  if (fam.family !== "midi") {
    return {
      ok: false,
      errorCode: "FORMAT_CONTRACT_REQUIRED",
      requestedLevel: "CONVERT_FROM_UAOS_IR",
      maxProven: fam.maxProven,
      family: fam.family
    };
  }
  const noteEvents = ir?.noteEvents || ir?.ir?.noteEvents;
  if (!Array.isArray(noteEvents) || noteEvents.length === 0) {
    return { ok: false, errorCode: "IR_MISSING_NOTE_EVENTS", family: "midi" };
  }
  const ppq = ir?.ppq || ir?.ir?.ppq || 480;
  const bytes = encodeMidiSmf({ noteEvents, ppq });
  return {
    ok: true,
    family: "midi",
    level: "CONVERT_FROM_UAOS_IR",
    bytes,
    musicalQualityClaim: false,
    hardwareVerified: false
  };
}

export function proveMidiRoundtrip(buffer) {
  return roundtripMidiPitches(buffer);
}

export { parseMidiSmf, encodeMidiSmf, familySupportMatrix };
