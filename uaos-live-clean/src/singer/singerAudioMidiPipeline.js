export const SINGER_AUDIO_MIDI_PIPELINE = Object.freeze({
  gate: "SINGER-REAL-PRODUCT-GATE-02-AUDIO-TO-MIDI-PIPELINE",
  mode: "SAFE_AUDIO_TO_MIDI_FOUNDATION",
  sale: "LOCKED",
  payment: "NOT_ACTIVE",
  minHz: 50,
  maxHz: 2000,
});

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export function frequencyToMidi(freq = 440) {
  const f = Number(freq);
  if (!Number.isFinite(f) || f <= 0) return null;
  return Math.round(69 + 12 * Math.log2(f / 440));
}

export function midiToName(midi = 69) {
  const n = Math.max(0, Math.min(127, Math.round(Number(midi))));
  return `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 1}`;
}

export function pitchEventsToMidiNotes(events = []) {
  const notes = [];
  let current = null;
  for (const ev of events) {
    const time = Number(ev.time ?? 0);
    const freq = Number(ev.freq ?? 0);
    const midi = frequencyToMidi(freq);
    const voiced = midi !== null && freq >= SINGER_AUDIO_MIDI_PIPELINE.minHz && freq <= SINGER_AUDIO_MIDI_PIPELINE.maxHz;
    if (!voiced) {
      if (current) {
        current.duration = Math.max(0.05, time - current.start);
        notes.push(current);
        current = null;
      }
      continue;
    }
    if (!current) {
      current = { midi, noteName: midiToName(midi), start: time, duration: 0.1 };
      continue;
    }
    if (Math.abs(current.midi - midi) <= 1) {
      current.midi = Math.round((current.midi + midi) / 2);
      current.noteName = midiToName(current.midi);
      current.duration = Math.max(0.05, time - current.start);
    } else {
      current.duration = Math.max(0.05, time - current.start);
      notes.push(current);
      current = { midi, noteName: midiToName(midi), start: time, duration: 0.1 };
    }
  }
  if (current) notes.push(current);
  return notes;
}

export function createSingerAudioMidiReport(events = []) {
  const notes = pitchEventsToMidiNotes(events);
  return {
    gate: SINGER_AUDIO_MIDI_PIPELINE.gate,
    mode: SINGER_AUDIO_MIDI_PIPELINE.mode,
    sale: SINGER_AUDIO_MIDI_PIPELINE.sale,
    payment: SINGER_AUDIO_MIDI_PIPELINE.payment,
    eventCount: events.length,
    noteCount: notes.length,
    notes,
    exports: { midi: "NEXT_GATE", pdf: "LOCKED", video: "LOCKED", mobile: "LOCKED" },
    commercialReady: false,
  };
}
