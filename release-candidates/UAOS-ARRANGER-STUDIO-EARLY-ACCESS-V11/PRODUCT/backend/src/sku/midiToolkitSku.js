/**
 * UAOS MIDI Toolkit — customer SKU consolidation (P1).
 */
import { voiceMelodyToMidiFinalize } from "../perception/voiceMelodyFinalize.js";
import { keyboardProFinalize } from "../keyboard/keyboardProFinalize.js";
import { converterFinalize } from "../convert/converterFinalize.js";
import { normalizeMidiToIr, inspectBuffer, familySupportMatrix } from "../convert/uaosNeutralIr.js";

export const SKU_ID = "uaos-midi-toolkit";
export const SKU_VERSION = "v10-rc1";

export const MODES = [
  "AUDIO_TO_MIDI",
  "MIDI_INSPECT_AND_CLEAN",
  "MIDI_NORMALIZE",
  "FORMAT_INSPECT",
  "CONVERT_WHERE_VERIFIED"
];

export function getMidiToolkitStatus() {
  const voice = voiceMelodyToMidiFinalize();
  const keyboard = keyboardProFinalize({ name: "toolkit-inspect" });
  const converter = converterFinalize();
  return {
    sku: SKU_ID,
    version: SKU_VERSION,
    modes: MODES,
    voice,
    keyboard,
    converter,
    neutralIr: true,
    externalGates: [
      ...new Set([
        ...(voice.BLOCKED_EXTERNAL_GATES || []),
        ...(keyboard.BLOCKED_EXTERNAL_GATES || []),
        ...(converter.BLOCKED_EXTERNAL_GATES || [])
      ])
    ],
    publicRelease: false,
    differentiation: "AUDIO/MIDI → context-aware analysis → Neutral IR → safe conversion → Arranger Studio path"
  };
}

export function runMidiToolkitMode(mode) {
  switch (mode) {
    case "AUDIO_TO_MIDI":
      return { mode, ...voiceMelodyToMidiFinalize() };
    case "MIDI_INSPECT_AND_CLEAN":
      return { mode, ...keyboardProFinalize({ name: "midi-inspect" }) };
    case "MIDI_NORMALIZE": {
      const fin = converterFinalize();
      return { mode, ok: fin.ok, level: fin.midi.level };
    }
    case "FORMAT_INSPECT": {
      const korg = inspectBuffer(Buffer.from("SET"), ".set", "Korg");
      return { mode, ok: korg.ok, level: korg.level, write: "FORMAT_CONTRACT_REQUIRED" };
    }
    case "CONVERT_WHERE_VERIFIED":
      return { mode, ...converterFinalize() };
    default:
      return { ok: false, errorCode: "MODE_NOT_FOUND", mode };
  }
}

export function getCompatibilityMatrix() {
  const matrix = familySupportMatrix();
  return [
    { feature: "Offline notes → SMF", status: "VERIFIED", gate: "HARDWARE_REQUIRED:microphone for live audio" },
    { feature: "MIDI SMF roundtrip", status: "VERIFIED", gate: "none" },
    { feature: "SysEx inspect F0/F7", status: "VERIFIED", gate: "INSPECT_ONLY" },
    { feature: "Keyboard file inspect", status: "INSPECT_ONLY", gate: "FORMAT_CONTRACT_REQUIRED for write" },
    { feature: "Proprietary family WRITE", status: "FORMAT_CONTRACT_REQUIRED", gate: "No invented specs" },
    ...matrix.map((m) => ({
      feature: `${m.family} ${m.operation}`,
      status: m.level,
      gate: m.gate || "none"
    }))
  ];
}
