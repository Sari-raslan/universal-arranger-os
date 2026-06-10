export function detectChord(notes = []) {
  const clean = [...new Set(notes)].sort();
  return {
    input: notes,
    normalized: clean,
    chord: clean.length ? 'analysis-pending' : 'none'
  };
}

export function transpose(note, semitones = 0) {
  return { note, semitones, result: 'pending-midi-map' };
}
