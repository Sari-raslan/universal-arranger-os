/**
 * Converter program finalization — max proven levels + honest gates.
 */
import {
  familySupportMatrix,
  inspectBuffer,
  normalizeMidiToIr,
  convertFromIr,
  proveMidiRoundtrip,
  encodeMidiSmf,
  canClaim,
  familyFromExtension
} from "./uaosNeutralIr.js";
import { inspectSysex } from "./familyAdapters.js";

export function converterFinalize() {
  const midiBytes = encodeMidiSmf({
    noteEvents: [
      { midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 },
      { midi: 64, startTick: 480, durationTicks: 480, velocity: 80, channel: 0 },
      { midi: 67, startTick: 960, durationTicks: 480, velocity: 80, channel: 0 },
      { midi: 72, startTick: 1440, durationTicks: 480, velocity: 80, channel: 0 }
    ]
  });
  const ir = normalizeMidiToIr(midiBytes);
  const back = convertFromIr(ir.ir);
  const roundtrip = proveMidiRoundtrip(midiBytes);
  const sysex = inspectSysex(Buffer.from([0xf0, 0x42, 0x00, 0xf7]));
  const korg = inspectBuffer(Buffer.from("SET"), ".set", "Korg");
  const matrix = familySupportMatrix();
  const yamahaWrite = canClaim(familyFromExtension(".sty", "Yamaha"), "WRITE");
  return {
    ok: ir.ok && back.ok && roundtrip.ok && sysex.ok && korg.ok && matrix.length === 6 && !yamahaWrite.ok,
    midi: { level: "ROUNDTRIP_VERIFIED", ok: roundtrip.ok },
    sysex: { level: "INSPECT", ok: sysex.ok, write: "HARDWARE_REQUIRED" },
    proprietary: {
      level: "INSPECT",
      write: "FORMAT_CONTRACT_REQUIRED",
      families: matrix.filter((f) => f.gate).map((f) => f.family)
    },
    matrix,
    BLOCKED_EXTERNAL_GATES: ["FORMAT_CONTRACT_REQUIRED", "HARDWARE_REQUIRED"],
    commercialReady: false,
    capabilityId: "uaos.converter.finalize/v1"
  };
}
