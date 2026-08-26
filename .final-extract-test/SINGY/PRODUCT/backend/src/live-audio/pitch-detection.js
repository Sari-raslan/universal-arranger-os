export function frequencyToMidiNote(frequency) {
  if (!frequency || frequency <= 0) return null;

  const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const name = noteNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;

  return {
    midi,
    note: `${name}${octave}`,
    frequency
  };
}

export function estimatePitchFromSamples(samples, sampleRate = 44100) {
  if (!samples || samples.length < 32) return null;

  let crossings = 0;

  for (let i = 1; i < samples.length; i++) {
    if (
      (samples[i - 1] < 0 && samples[i] >= 0) ||
      (samples[i - 1] > 0 && samples[i] <= 0)
    ) {
      crossings++;
    }
  }

  const seconds = samples.length / sampleRate;
  const frequency = crossings / (2 * seconds);

  if (!Number.isFinite(frequency) || frequency < 40 || frequency > 2000) {
    return null;
  }

  return frequencyToMidiNote(frequency);
}

export function buildMelodyFromPitchEvents(events) {
  return events
    .filter((event) => event?.note)
    .map((event, index) => ({
      id: `live-note-${index + 1}`,
      pitch: event.note,
      midi: event.midi,
      frequency: event.frequency,
      startBeat: index,
      duration: 'quarter',
      velocity: 80
    }));
}
