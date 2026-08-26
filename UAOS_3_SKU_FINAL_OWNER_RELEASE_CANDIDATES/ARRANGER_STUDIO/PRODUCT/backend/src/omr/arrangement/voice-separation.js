export function separateChordsAndVoices(rhythmModel) {
  const voices = {};

  for (const note of rhythmModel.notes) {
    const key = String(note.voice || 1);
    voices[key] = voices[key] || [];
    voices[key].push(note);
  }

  const chords = [];
  const byBeat = new Map();

  for (const note of rhythmModel.notes) {
    const key = String(note.startBeat);
    byBeat.set(key, [...(byBeat.get(key) || []), note]);
  }

  for (const [beat, notes] of byBeat.entries()) {
    if (notes.length > 1) {
      chords.push({
        startBeat: Number(beat),
        notes
      });
    }
  }

  return {
    voices,
    chords
  };
}
