import { frequencyToMidi, midiToName } from "./singerAudioMidiPipeline.js";
export function createSingerPitchDetectionProof(frequencies = []) {
  const notes = frequencies.map((freq, index) => {
    const midi = frequencyToMidi(freq);
    return { index, freq, midi, noteName: midi === null ? null : midiToName(midi), voiced: midi !== null };
  });
  return {
    gate: "SINGER-REAL-PRODUCT-GATE-05-PITCH-DETECTION-PROOF",
    mode: "PITCH_DETECTION_PROOF_FROM_EVENTS",
    sale: "LOCKED",
    payment: "NOT_ACTIVE",
    inputCount: frequencies.length,
    voicedCount: notes.filter((x) => x.voiced).length,
    notes,
    commercialReady: false,
    nextGate: "SINGER-REAL-PRODUCT-GATE-06-LEARNING-EXPORT-PACKAGE"
  };
}
