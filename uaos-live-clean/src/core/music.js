export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function frequencyToMidi(freq) {
  if (!Number.isFinite(freq) || freq <= 0) return null;
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

export function midiToNoteName(midi) {
  if (!Number.isFinite(midi)) return "--";
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

export function frequencyToNote(freq) {
  const midi = frequencyToMidi(freq);
  if (midi === null) return { midi: null, name: "--" };
  return { midi, name: midiToNoteName(midi) };
}

export function estimateChordFromMidiNotes(notes = []) {
  const pcs = [...new Set(notes.map((note) => ((note % 12) + 12) % 12))].sort((a, b) => a - b);
  if (pcs.length < 3) return { name: "Unknown", confidence: 0 };
  for (const root of pcs) {
    const intervals = pcs.map((pc) => (pc - root + 12) % 12);
    if ([0, 4, 7].every((i) => intervals.includes(i))) return { name: `${NOTE_NAMES[root]}`, confidence: 0.75 };
    if ([0, 3, 7].every((i) => intervals.includes(i))) return { name: `${NOTE_NAMES[root]}m`, confidence: 0.75 };
    if ([0, 4, 7, 10].every((i) => intervals.includes(i))) return { name: `${NOTE_NAMES[root]}7`, confidence: 0.8 };
  }
  return { name: "Cluster", confidence: 0.35 };
}

