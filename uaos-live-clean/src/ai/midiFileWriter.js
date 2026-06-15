function byte(value) {
  if (!Number.isInteger(value) || value < 0 || value > 255) throw new RangeError("Invalid MIDI byte");
  return value;
}

function uint32(value) {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

function uint16(value) {
  return [(value >>> 8) & 255, value & 255];
}

function textBytes(text) {
  return Array.from(String(text || ""), (char) => char.charCodeAt(0) & 127);
}

export function writeVariableLength(value) {
  let buffer = Number(value || 0) & 0x0fffffff;
  const bytes = [buffer & 0x7f];
  while ((buffer >>= 7)) bytes.unshift((buffer & 0x7f) | 0x80);
  return bytes;
}

export function validateMidiNotes(notes = []) {
  const errors = [];
  for (const [index, note] of notes.entries()) {
    if (!Number.isFinite(note.start) || note.start < 0) errors.push(`note ${index} start is invalid`);
    if (!Number.isFinite(note.duration) || note.duration <= 0) errors.push(`note ${index} duration is invalid`);
    if (!Number.isInteger(Math.round(note.midi)) || note.midi < 0 || note.midi > 127) errors.push(`note ${index} MIDI note is out of range`);
    if (note.velocity != null && (note.velocity < 1 || note.velocity > 127)) errors.push(`note ${index} velocity is out of range`);
  }
  return errors;
}

export function notesToTrackEvents(notes = [], { ppq = 480, bpm = 120, channel = 1 } = {}) {
  const secondsToTicks = (seconds) => Math.max(0, Math.round((seconds / (60 / bpm)) * ppq));
  return notes.flatMap((note) => {
    const midi = Math.max(0, Math.min(127, Math.round(note.midi)));
    const start = secondsToTicks(note.start);
    const duration = Math.max(1, secondsToTicks(note.duration));
    const velocity = Math.max(1, Math.min(127, Math.round(note.velocity || 80)));
    return [
      { tick: start, bytes: [0x90 + (channel - 1), midi, velocity], label: "note-on" },
      { tick: start + duration, bytes: [0x80 + (channel - 1), midi, 0], label: "note-off" },
    ];
  }).sort((a, b) => a.tick - b.tick || (a.label === "note-off" ? -1 : 1));
}

export function writeStandardMidiFile({
  notes = [],
  bpm = 120,
  ppq = 480,
  timeSignature = [4, 4],
  trackName = "UAOS Voice Melody",
  channel = 1,
  program = null,
} = {}) {
  const errors = validateMidiNotes(notes);
  if (errors.length) throw new Error(errors.join("; "));
  const header = [...textBytes("MThd"), ...uint32(6), ...uint16(0), ...uint16(1), ...uint16(ppq)];
  const tempo = Math.max(1, Math.round(60_000_000 / Math.max(1, bpm)));
  const denominatorPower = Math.round(Math.log2(timeSignature[1] || 4));
  const events = [
    { tick: 0, bytes: [0xff, 0x03, ...writeVariableLength(trackName.length), ...textBytes(trackName)], label: "track-name" },
    { tick: 0, bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255], label: "tempo" },
    { tick: 0, bytes: [0xff, 0x58, 0x04, byte(timeSignature[0] || 4), byte(denominatorPower), 24, 8], label: "time-signature" },
  ];
  if (program != null) events.push({ tick: 0, bytes: [0xc0 + (channel - 1), byte(program)], label: "program" });
  events.push(...notesToTrackEvents(notes, { ppq, bpm, channel }));
  events.sort((a, b) => a.tick - b.tick || a.label.localeCompare(b.label));
  let lastTick = 0;
  const track = [];
  for (const event of events) {
    const delta = event.tick - lastTick;
    if (delta < 0) throw new Error("Invalid MIDI delta time.");
    track.push(...writeVariableLength(delta), ...event.bytes);
    lastTick = event.tick;
  }
  track.push(0, 0xff, 0x2f, 0);
  return new Uint8Array([...header, ...textBytes("MTrk"), ...uint32(track.length), ...track]);
}

export function createMidiDownloadPayload(notes, options = {}) {
  const bytes = writeStandardMidiFile({ notes, ...options });
  return {
    fileName: `${String(options.trackName || "uaos-voice-melody").replace(/[^a-z0-9_-]+/gi, "-")}.mid`,
    mimeType: "audio/midi",
    bytes,
    size: bytes.length,
    localDownloadOnly: true,
  };
}
