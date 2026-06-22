export const SINGER_MIDI_EXPORT_GATE = Object.freeze({
  gate: "SINGER-REAL-PRODUCT-GATE-03-MIDI-EXPORT-LEARNING-VIEW",
  mode: "SAFE_MIDI_EXPORT_LEARNING_VIEW",
  sale: "LOCKED",
  payment: "NOT_ACTIVE",
  ppq: 480,
});

function bytesFromText(text) {
  return Array.from(String(text)).map((c) => c.charCodeAt(0) & 255);
}

function u32(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}

function u16(n) {
  return [(n >>> 8) & 255, n & 255];
}

function vlq(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8; else break;
  }
  return bytes;
}

export function learningNotesToMidiBytes(notes = [], options = {}) {
  const ppq = Number(options.ppq || SINGER_MIDI_EXPORT_GATE.ppq);
  const tempo = Number(options.tempo || 120);
  const microsPerQuarter = Math.round(60000000 / tempo);
  const events = [];

  events.push(...vlq(0), 0xff, 0x51, 0x03, (microsPerQuarter >> 16) & 255, (microsPerQuarter >> 8) & 255, microsPerQuarter & 255);

  const sorted = [...notes].map((n) => ({
    midi: Math.max(0, Math.min(127, Math.round(Number(n.midi ?? 60)))),
    start: Math.max(0, Number(n.start ?? 0)),
    duration: Math.max(0.05, Number(n.duration ?? 0.5)),
  })).sort((a, b) => a.start - b.start);

  let tick = 0;
  for (const n of sorted) {
    const startTick = Math.round(n.start * ppq);
    const durTick = Math.max(1, Math.round(n.duration * ppq));
    events.push(...vlq(Math.max(0, startTick - tick)), 0x90, n.midi, 96);
    events.push(...vlq(durTick), 0x80, n.midi, 0);
    tick = startTick + durTick;
  }

  events.push(...vlq(0), 0xff, 0x2f, 0x00);

  const header = [...bytesFromText("MThd"), ...u32(6), ...u16(0), ...u16(1), ...u16(ppq)];
  const track = [...bytesFromText("MTrk"), ...u32(events.length), ...events];
  return new Uint8Array([...header, ...track]);
}

export function createSingerMidiLearningExport(notes = [], options = {}) {
  const bytes = learningNotesToMidiBytes(notes, options);
  return {
    gate: SINGER_MIDI_EXPORT_GATE.gate,
    mode: SINGER_MIDI_EXPORT_GATE.mode,
    sale: SINGER_MIDI_EXPORT_GATE.sale,
    payment: SINGER_MIDI_EXPORT_GATE.payment,
    noteCount: notes.length,
    byteLength: bytes.length,
    hasMidiHeader: bytes[0] === 77 && bytes[1] === 84 && bytes[2] === 104 && bytes[3] === 100,
    hasTrackHeader: Array.from(bytes).some((_, i, a) => a[i] === 77 && a[i+1] === 84 && a[i+2] === 114 && a[i+3] === 107),
    midiBytes: Array.from(bytes),
    commercialReady: false,
    nextGate: "SINGER-REAL-PRODUCT-GATE-04-AUDIO-RECORD-UPLOAD-UI"
  };
}
