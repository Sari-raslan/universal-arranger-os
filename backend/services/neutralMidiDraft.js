function clampInteger(value, minimum, maximum, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(number)));
}

function encodeVariableLength(value) {
  let buffer = value & 0x7f;
  const bytes = [];

  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }

  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }

  return bytes;
}

function uint16(value) {
  return [(value >> 8) & 0xff, value & 0xff];
}

function uint32(value) {
  return [
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff
  ];
}

function ascii(text) {
  return [...Buffer.from(String(text), "utf8")];
}

function metaEvent(delta, type, data) {
  return [
    ...encodeVariableLength(delta),
    0xff,
    type,
    ...encodeVariableLength(data.length),
    ...data
  ];
}

function midiEvent(delta, status, data1, data2 = null) {
  const bytes = [
    ...encodeVariableLength(delta),
    status,
    data1 & 0x7f
  ];

  if (data2 !== null) bytes.push(data2 & 0x7f);
  return bytes;
}

function createTrackChunk(events) {
  const body = Buffer.from(events);
  return Buffer.concat([
    Buffer.from("MTrk"),
    Buffer.from(uint32(body.length)),
    body
  ]);
}

function noteNameToMidi(key = "C") {
  const table = {
    C: 60,
    "C#": 61,
    Db: 61,
    D: 62,
    "D#": 63,
    Eb: 63,
    E: 64,
    F: 65,
    "F#": 66,
    Gb: 66,
    G: 67,
    "G#": 68,
    Ab: 68,
    A: 69,
    "A#": 70,
    Bb: 70,
    B: 71
  };

  return table[String(key)] ?? 60;
}

function normalizeSections(input) {
  const sections = Array.isArray(input) ? input : [];

  return sections.map((section, index) => ({
    type: String(section?.type || `section-${index + 1}`),
    startBar: clampInteger(section?.startBar, 1, 512, index + 1),
    lengthBars: clampInteger(section?.lengthBars, 1, 128, 4),
    energy: Math.min(1, Math.max(0, Number(section?.energy ?? 0.5)))
  }));
}

function createNeutralMidiDraft({
  title = "UAOS Arrangement Draft",
  bpm = 100,
  key = "C",
  scale = "minor",
  sections = []
} = {}) {
  const ppq = 480;
  const beatsPerBar = 4;
  const safeBpm = clampInteger(bpm, 40, 240, 100);
  const safeSections = normalizeSections(sections);
  const root = noteNameToMidi(key);
  const microsecondsPerQuarter = Math.round(60000000 / safeBpm);

  const track0 = [
    ...metaEvent(0, 0x03, ascii(title)),
    ...metaEvent(0, 0x51, [
      (microsecondsPerQuarter >> 16) & 0xff,
      (microsecondsPerQuarter >> 8) & 0xff,
      microsecondsPerQuarter & 0xff
    ]),
    ...metaEvent(0, 0x58, [4, 2, 24, 8]),
    ...metaEvent(0, 0x01, ascii(`Key=${key}; Scale=${scale}; Source=UAOS neutral draft`))
  ];

  let previousMarkerTick = 0;
  for (const section of safeSections) {
    const tick = (section.startBar - 1) * beatsPerBar * ppq;
    const delta = Math.max(0, tick - previousMarkerTick);
    track0.push(...metaEvent(delta, 0x06, ascii(section.type)));
    previousMarkerTick = tick;
  }

  track0.push(...metaEvent(0, 0x2f, []));

  const track1 = [
    ...metaEvent(0, 0x03, ascii("UAOS Guide Chords")),
    ...midiEvent(0, 0xc0, 0)
  ];

  const chordIntervals =
    String(scale).toLowerCase() === "major"
      ? [0, 4, 7]
      : [0, 3, 7];

  let previousEndTick = 0;

  for (const section of safeSections) {
    const sectionStartTick = (section.startBar - 1) * beatsPerBar * ppq;
    const chordLength = beatsPerBar * ppq;
    const velocity = clampInteger(40 + section.energy * 45, 24, 96, 64);

    for (let bar = 0; bar < section.lengthBars; bar += 1) {
      const startTick = sectionStartTick + bar * chordLength;
      const delta = Math.max(0, startTick - previousEndTick);

      chordIntervals.forEach((interval, index) => {
        track1.push(...midiEvent(index === 0 ? delta : 0, 0x90, root + interval, velocity));
      });

      chordIntervals.forEach((interval, index) => {
        track1.push(...midiEvent(index === 0 ? chordLength : 0, 0x80, root + interval, 0));
      });

      previousEndTick = startTick + chordLength;
    }
  }

  track1.push(...metaEvent(0, 0x2f, []));

  const header = Buffer.concat([
    Buffer.from("MThd"),
    Buffer.from(uint32(6)),
    Buffer.from(uint16(1)),
    Buffer.from(uint16(2)),
    Buffer.from(uint16(ppq))
  ]);

  const midi = Buffer.concat([
    header,
    createTrackChunk(track0),
    createTrackChunk(track1)
  ]);

  return {
    filename: `${String(title).replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "uaos-arrangement"}.mid`,
    contentType: "audio/midi",
    buffer: midi,
    manifest: {
      title,
      bpm: safeBpm,
      key,
      scale,
      ppq,
      tracks: 2,
      sectionCount: safeSections.length,
      containsProprietaryData: false
    }
  };
}

module.exports = {
  createNeutralMidiDraft
};