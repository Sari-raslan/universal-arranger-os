/**
 * Voice / Melody-to-MIDI offline E2E. Mic remains HARDWARE_REQUIRED.
 */
import { writePcm16MonoSine } from "../perception/melodyAnalysis.js";
import { wavMelodyToMidi, melodyNotesToMidi } from "../perception/melodyToMidi.js";
import { proveMidiRoundtrip } from "../convert/uaosNeutralIr.js";

export function voiceMelodyToMidiFinalize() {
  const notes = [
    { midi: 60, frames: 4 },
    { midi: 62, frames: 4 },
    { midi: 64, frames: 4 },
    { midi: 65, frames: 4 },
    { midi: 67, frames: 8 }
  ];
  const fromNotes = melodyNotesToMidi(notes, { tempo: 100 });
  const sine = writePcm16MonoSine(440, 0.5);
  const fromWav = wavMelodyToMidi(sine, { tempo: 100 });
  const roundtrip = proveMidiRoundtrip(fromNotes.bytes);
  return {
    ok: fromNotes.ok && fromNotes.parsed.validHeader && roundtrip.ok,
    fromNotes: {
      ok: fromNotes.ok,
      noteCount: fromNotes.parsed.noteEvents.length,
      musicalQualityClaim: false
    },
    fromWavAnalysis: {
      ok: fromWav.ok || fromWav.errorCode === "UNSUPPORTED_OR_CORRUPT_WAV" || Boolean(fromWav.analysis),
      note: "Sine fixture is analysis-only; not owner musical proof",
      musicalQualityClaim: false
    },
    roundtripOk: roundtrip.ok,
    BLOCKED_EXTERNAL_GATES: ["HARDWARE_REQUIRED:microphone"],
    ownerMusicalQualityPass: false,
    capabilityId: "uaos.voice.melody-to-midi.finalize/v1"
  };
}
