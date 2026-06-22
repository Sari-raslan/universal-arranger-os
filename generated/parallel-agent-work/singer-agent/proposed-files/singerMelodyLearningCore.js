export const SINGER_LEARNING_CORE = Object.freeze({
  gate: "SINGER-REAL-PRODUCT-GATE-01-MELODY-LEARNING-CORE",
  mode: "SAFE_MELODY_LEARNING_CORE",
  commercialSale: "LOCKED",
  payment: "NOT_ACTIVE",
  supportedInstruments: ["piano", "violin", "oud", "guitar", "strings", "sax"],
});

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export function midiNoteName(midi = 60) {
  const n = Math.max(0, Math.min(127, Math.round(Number(midi))));
  const name = NOTE_NAMES[n % 12];
  const octave = Math.floor(n / 12) - 1;
  return `${name}${octave}`;
}

export function buildSingerLearningNotes(notes = [], instrument = "piano") {
  const selectedInstrument = SINGER_LEARNING_CORE.supportedInstruments.includes(instrument) ? instrument : "piano";
  return notes.map((note, index) => {
    const midi = Math.round(Number(note.midi ?? 60));
    const start = Number(note.start ?? index);
    const duration = Math.max(0.05, Number(note.duration ?? 0.5));
    return {
      index,
      midi,
      noteName: midiNoteName(midi),
      start,
      duration,
      instrument: selectedInstrument,
      learningLabel: `${selectedInstrument.toUpperCase()} ${midiNoteName(midi)}`,
    };
  });
}

export function createSingerLearningReport(notes = [], instrument = "piano") {
  const learningNotes = buildSingerLearningNotes(notes, instrument);
  return {
    gate: SINGER_LEARNING_CORE.gate,
    mode: SINGER_LEARNING_CORE.mode,
    commercialSale: SINGER_LEARNING_CORE.commercialSale,
    payment: SINGER_LEARNING_CORE.payment,
    instrument: SINGER_LEARNING_CORE.supportedInstruments.includes(instrument) ? instrument : "piano",
    noteCount: learningNotes.length,
    learningNotes,
    exports: { midi: "PLANNED_GATE", pdf: "PLANNED_GATE", video: "PLANNED_GATE", mobile: "PLANNED_GATE" },
  };
}
