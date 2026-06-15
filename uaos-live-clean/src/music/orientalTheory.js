import { noteName, pitchClass, transposePitchClass } from "./musicTheory.js";

export const MAQAM_SCHEMA_VERSION = 1;

export const MAQAM_METADATA = Object.freeze({
  rast: {
    id: "rast",
    name: "Rast",
    tonic: "C",
    jins: ["Rast", "Rast/G"],
    degrees: [0, 2, 4, 5, 7, 9, 10],
    cents: [0, 200, 350, 500, 700, 900, 1050],
    quarterToneDegrees: [2, 6],
  },
  bayati: {
    id: "bayati",
    name: "Bayati",
    tonic: "D",
    jins: ["Bayati", "Nahawand/A"],
    degrees: [0, 1, 3, 5, 7, 8, 10],
    cents: [0, 150, 300, 500, 700, 800, 1000],
    quarterToneDegrees: [1],
  },
  hijaz: {
    id: "hijaz",
    name: "Hijaz",
    tonic: "D",
    jins: ["Hijaz", "Nahawand/G"],
    degrees: [0, 1, 4, 5, 7, 8, 10],
    cents: [0, 100, 400, 500, 700, 800, 1000],
    quarterToneDegrees: [],
  },
  nahawand: {
    id: "nahawand",
    name: "Nahawand",
    tonic: "C",
    jins: ["Nahawand", "Hijaz/G"],
    degrees: [0, 2, 3, 5, 7, 8, 10],
    cents: [0, 200, 300, 500, 700, 800, 1000],
    quarterToneDegrees: [],
  },
  kurd: {
    id: "kurd",
    name: "Kurd",
    tonic: "D",
    jins: ["Kurd", "Nahawand/G"],
    degrees: [0, 1, 3, 5, 7, 8, 10],
    cents: [0, 100, 300, 500, 700, 800, 1000],
    quarterToneDegrees: [],
  },
  ajam: {
    id: "ajam",
    name: "Ajam",
    tonic: "C",
    jins: ["Ajam", "Ajam/G"],
    degrees: [0, 2, 4, 5, 7, 9, 11],
    cents: [0, 200, 400, 500, 700, 900, 1100],
    quarterToneDegrees: [],
  },
  saba: {
    id: "saba",
    name: "Saba",
    tonic: "D",
    jins: ["Saba"],
    degrees: [0, 1, 3, 4, 7, 8, 10],
    cents: [0, 150, 300, 450, 700, 800, 1000],
    quarterToneDegrees: [1, 3],
  },
  sikah: {
    id: "sikah",
    name: "Sikah",
    tonic: "E half-flat",
    jins: ["Sikah"],
    degrees: [0, 2, 4, 5, 7, 9, 10],
    cents: [0, 200, 350, 500, 700, 900, 1050],
    quarterToneDegrees: [0, 2, 6],
  },
});

export function createMaqam(metadata) {
  return {
    schemaVersion: MAQAM_SCHEMA_VERSION,
    id: metadata.id,
    name: metadata.name,
    tonic: metadata.tonic,
    jins: [...metadata.jins],
    degrees: [...metadata.degrees],
    cents: [...metadata.cents],
    quarterToneDegrees: [...metadata.quarterToneDegrees],
    temperament: "maqam-metadata-reference",
    midiApproximation: "12-TET approximation only; quarter tones require pitch bend, MPE, or a tuning system.",
    pitchBendRequired: metadata.quarterToneDegrees.length > 0,
    confidence: 0.5,
    manualCorrectionSupported: true,
    experimental: true,
  };
}

export function getMaqam(id = "rast") {
  return createMaqam(MAQAM_METADATA[id] || MAQAM_METADATA.rast);
}

export function transposeMaqam(id, semitones) {
  const maqam = getMaqam(id);
  return {
    ...maqam,
    transposition: Number(semitones || 0),
    degrees: maqam.degrees.map((degree) => transposePitchClass(degree, semitones)),
    noteSpellings: maqam.degrees.map((degree) => noteName(transposePitchClass(degree, semitones))),
  };
}

export function lookupScaleDegree(maqam, midiNote) {
  const pc = pitchClass(midiNote);
  const index = maqam.degrees.findIndex((degree) => pitchClass(degree) === pc);
  return index < 0 ? null : {
    degree: index + 1,
    centsOffset: maqam.cents[index] - maqam.degrees[index] * 100,
    quarterTone: maqam.quarterToneDegrees.includes(index),
  };
}

export function validateMaqam(value) {
  const errors = [];
  if (!value || typeof value !== "object") return ["maqam must be an object"];
  if (value.schemaVersion !== MAQAM_SCHEMA_VERSION) errors.push("schemaVersion must be 1");
  if (!value.id || !value.name) errors.push("id and name are required");
  if (!Array.isArray(value.degrees) || value.degrees.length !== 7) errors.push("degrees must contain seven entries");
  if (!Array.isArray(value.cents) || value.cents.length !== 7) errors.push("cents must contain seven entries");
  return errors;
}

export function estimateMaqamFromPitchClassProfile(profile = []) {
  let best = { maqam: getMaqam("rast"), score: 0 };
  for (const id of Object.keys(MAQAM_METADATA)) {
    const maqam = getMaqam(id);
    const score = maqam.degrees.reduce((sum, degree) => sum + Number(profile[pitchClass(degree)] || 0), 0);
    if (score > best.score) best = { maqam, score };
  }
  const total = profile.reduce((sum, value) => sum + Number(value || 0), 0);
  return {
    ...best.maqam,
    confidence: total ? Math.min(0.72, best.score / total) : 0,
    experimental: true,
  };
}
