export const INSTRUMENT_PRESET_SCHEMA_VERSION = 1;

export const DEFAULT_ENVELOPE = Object.freeze({
  attack: 0.01,
  decay: 0.12,
  sustain: 0.82,
  release: 0.35,
});

export const DEFAULT_FILTER = Object.freeze({
  type: "lowpass",
  cutoff: 18000,
  resonance: 0.7,
});

const NOTE_NAMES = Object.freeze({
  C: 0,
  "C#": 1,
  DB: 1,
  D: 2,
  "D#": 3,
  EB: 3,
  E: 4,
  F: 5,
  "F#": 6,
  GB: 6,
  G: 7,
  "G#": 8,
  AB: 8,
  A: 9,
  "A#": 10,
  BB: 10,
  B: 11,
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

export function noteNameToMidi(noteName) {
  const normalized = String(noteName || "").trim().toUpperCase();
  const match = /^([A-G])([#B]?)(-?\d+)$/.exec(normalized);

  if (!match) {
    return null;
  }

  const pitchClass = NOTE_NAMES[`${match[1]}${match[2]}`];

  if (pitchClass == null) {
    return null;
  }

  const octave = Number(match[3]);
  const note = (octave + 1) * 12 + pitchClass;

  return note >= 0 && note <= 127 ? note : null;
}

export function inferRootNoteFromFileName(fileName, fallback = 60) {
  const baseName = String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ");

  const noteMatch = /(?:^|\s)([A-Ga-g])([#b]?)(-?\d)(?:\s|$)/.exec(baseName);

  if (noteMatch) {
    const parsed = noteNameToMidi(
      `${noteMatch[1]}${noteMatch[2]}${noteMatch[3]}`,
    );

    if (parsed != null) {
      return parsed;
    }
  }

  const midiMatch = /(?:root|note|midi)[ _-]?(\d{1,3})/i.exec(fileName || "");

  if (midiMatch) {
    return clamp(Number(midiMatch[1]), 0, 127);
  }

  return clamp(fallback, 0, 127);
}

export function playbackRateForNotes(note, rootNote) {
  return 2 ** ((Number(note) - Number(rootNote)) / 12);
}

export function normalizeSampleZone(sample, index = 0) {
  const fileName = String(sample.fileName || sample.name || `sample-${index + 1}.wav`);

  return {
    id: String(sample.id || `sample-${index + 1}`),
    fileName,
    displayName: String(
      sample.displayName ||
      fileName.replace(/\.[^.]+$/, "") ||
      `Sample ${index + 1}`,
    ),
    rootNote: clamp(
      sample.rootNote ?? inferRootNoteFromFileName(fileName),
      0,
      127,
    ),
    keyLow: clamp(sample.keyLow ?? 0, 0, 127),
    keyHigh: clamp(sample.keyHigh ?? 127, 0, 127),
    velocityLow: clamp(sample.velocityLow ?? 1, 1, 127),
    velocityHigh: clamp(sample.velocityHigh ?? 127, 1, 127),
    gain: clamp(sample.gain ?? 1, 0, 4),
    pan: clamp(sample.pan ?? 0, -1, 1),
    roundRobinGroup: String(sample.roundRobinGroup || "main"),
    loaded: Boolean(sample.loaded),
    size: Number(sample.size || 0),
    type: String(sample.type || "audio/wav"),
  };
}

export function serializeSampleZone(sample, index = 0) {
  return {
    ...normalizeSampleZone(sample, index),
    loaded: false,
  };
}

export function validateInstrumentPreset(value) {
  const errors = [];

  if (!value || typeof value !== "object") {
    return {
      valid: false,
      errors: ["Preset must be an object."],
    };
  }

  if (value.schemaVersion !== INSTRUMENT_PRESET_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must be ${INSTRUMENT_PRESET_SCHEMA_VERSION}.`,
    );
  }

  if (!String(value.name || "").trim()) {
    errors.push("Preset name is required.");
  }

  if (!Array.isArray(value.samples)) {
    errors.push("Preset samples must be an array.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createInstrumentPreset({
  name = "UAOS Instrument",
  samples = [],
  envelope = DEFAULT_ENVELOPE,
  filter = DEFAULT_FILTER,
  masterGain = 0.9,
} = {}) {
  return {
    schemaVersion: INSTRUMENT_PRESET_SCHEMA_VERSION,
    name: String(name || "UAOS Instrument"),
    createdAt: new Date().toISOString(),
    masterGain: clamp(masterGain, 0, 2),
    envelope: {
      attack: clamp(envelope.attack ?? DEFAULT_ENVELOPE.attack, 0, 10),
      decay: clamp(envelope.decay ?? DEFAULT_ENVELOPE.decay, 0, 10),
      sustain: clamp(envelope.sustain ?? DEFAULT_ENVELOPE.sustain, 0, 1),
      release: clamp(envelope.release ?? DEFAULT_ENVELOPE.release, 0.01, 20),
    },
    filter: {
      type: String(filter.type || DEFAULT_FILTER.type),
      cutoff: clamp(filter.cutoff ?? DEFAULT_FILTER.cutoff, 20, 22000),
      resonance: clamp(filter.resonance ?? DEFAULT_FILTER.resonance, 0.0001, 40),
    },
    samples: samples.map(serializeSampleZone),
  };
}

export function parseInstrumentPreset(text) {
  const parsed = JSON.parse(text);
  const validation = validateInstrumentPreset(parsed);

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  return createInstrumentPreset(parsed);
}

export function selectSampleZone(samples, note, velocity, cursor = 0) {
  const matching = samples.filter((sample) => (
    sample.loaded &&
    note >= sample.keyLow &&
    note <= sample.keyHigh &&
    velocity >= sample.velocityLow &&
    velocity <= sample.velocityHigh
  ));

  if (matching.length === 0) {
    return {
      item: null,
      candidates: [],
      nextCursor: cursor,
    };
  }

  const normalizedCursor = ((cursor % matching.length) + matching.length) %
    matching.length;

  return {
    item: matching[normalizedCursor],
    candidates: matching,
    nextCursor: (normalizedCursor + 1) % matching.length,
  };
}