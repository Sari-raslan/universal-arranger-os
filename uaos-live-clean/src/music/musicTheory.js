export const NOTE_NAMES_SHARP = Object.freeze(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
export const NOTE_NAMES_FLAT = Object.freeze(["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]);

export const SCALE_INTERVALS = Object.freeze({
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
});

export const CHORD_INTERVALS = Object.freeze({
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  dominant7: [0, 4, 7, 10],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
});

export function pitchClass(value) {
  return ((Number(value) % 12) + 12) % 12;
}

export function noteName(pc, { flats = false } = {}) {
  return (flats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP)[pitchClass(pc)];
}

export function parseNoteName(name) {
  const match = /^([A-Ga-g])([#b]?)(-?\d+)?$/.exec(String(name || "").trim());
  if (!match) return null;
  const letter = match[1].toUpperCase();
  const accidental = match[2] || "";
  const map = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const pc = pitchClass(map[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0));
  if (match[3] == null) return { pitchClass: pc, midi: null, octave: null };
  const octave = Number(match[3]);
  return { pitchClass: pc, octave, midi: (octave + 1) * 12 + pc };
}

export function transposePitchClass(pc, semitones) {
  return pitchClass(Number(pc) + Number(semitones || 0));
}

export function buildScale(root, type = "major") {
  const intervals = SCALE_INTERVALS[type] || SCALE_INTERVALS.major;
  const rootPc = typeof root === "string" ? parseNoteName(root)?.pitchClass : pitchClass(root);
  return intervals.map((interval) => pitchClass(rootPc + interval));
}

export function isInScale(note, root, type = "major") {
  return buildScale(root, type).includes(pitchClass(note));
}

export function buildChord(root, quality = "major", inversion = 0) {
  const rootPc = typeof root === "string" ? parseNoteName(root)?.pitchClass : pitchClass(root);
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS.major;
  const pcs = intervals.map((interval) => pitchClass(rootPc + interval));
  const rotations = ((Number(inversion || 0) % pcs.length) + pcs.length) % pcs.length;
  return [...pcs.slice(rotations), ...pcs.slice(0, rotations)];
}

export function chordName(root, quality = "major", bass = null) {
  const suffix = {
    major: "",
    minor: "m",
    diminished: "dim",
    augmented: "aug",
    dominant7: "7",
    major7: "maj7",
    minor7: "m7",
  }[quality] ?? "";
  const base = `${noteName(root)}${suffix}`;
  return bass == null || pitchClass(bass) === pitchClass(root) ? base : `${base}/${noteName(bass)}`;
}

export function detectChord(pitchClasses = []) {
  const pcs = [...new Set(pitchClasses.map(pitchClass))];
  if (pcs.length < 2) return { name: "Unknown", root: null, quality: "unknown", bass: null, confidence: 0 };
  let best = { root: pcs[0], quality: "unknown", score: 0, intervals: [] };
  for (let root = 0; root < 12; root += 1) {
    for (const [quality, intervals] of Object.entries(CHORD_INTERVALS)) {
      const chord = intervals.map((interval) => pitchClass(root + interval));
      const hits = pcs.filter((pc) => chord.includes(pc)).length;
      const extras = pcs.filter((pc) => !chord.includes(pc)).length;
      const score = hits / Math.max(1, chord.length) - extras * 0.12;
      if (score > best.score) best = { root, quality, score, intervals };
    }
  }
  const bass = pcs[0];
  const confidence = Math.max(0, Math.min(0.95, best.score));
  return {
    name: confidence > 0.45 ? chordName(best.root, best.quality, bass) : "Cluster",
    root: best.root,
    quality: best.quality,
    bass,
    confidence,
  };
}

export function scoreKey(pitchClassProfile = [], root = 0, mode = "major") {
  const scale = buildScale(root, mode === "minor" ? "naturalMinor" : "major");
  const total = pitchClassProfile.reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
  if (!total) return 0;
  const inScale = pitchClassProfile.reduce((sum, value, pc) => sum + (scale.includes(pc) ? Math.max(0, Number(value || 0)) : 0), 0);
  const tonicWeight = Math.max(0, Number(pitchClassProfile[pitchClass(root)] || 0)) / total;
  return Math.min(1, inScale / total * 0.8 + tonicWeight * 0.2);
}

export function detectKey(pitchClassProfile = []) {
  let best = { key: "Unknown", root: null, mode: "unknown", confidence: 0 };
  for (let root = 0; root < 12; root += 1) {
    for (const mode of ["major", "minor"]) {
      const confidence = scoreKey(pitchClassProfile, root, mode);
      if (confidence > best.confidence) best = { key: noteName(root), root, mode, confidence };
    }
  }
  return best.confidence > 0 ? best : { key: "Unknown", root: null, mode: "unknown", confidence: 0 };
}

export function diatonicChords(root, mode = "major") {
  const scale = buildScale(root, mode === "minor" ? "naturalMinor" : "major");
  const majorQualities = ["major", "minor", "minor", "major", "major", "minor", "diminished"];
  const minorQualities = ["minor", "diminished", "major", "minor", "minor", "major", "major"];
  const qualities = mode === "minor" ? minorQualities : majorQualities;
  return scale.map((pc, index) => ({
    degree: index + 1,
    roman: romanNumeral(index + 1, qualities[index]),
    root: pc,
    quality: qualities[index],
    name: chordName(pc, qualities[index]),
  }));
}

export function romanNumeral(degree, quality = "major") {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const value = numerals[Math.max(0, Math.min(6, Number(degree) - 1))] || "I";
  return quality === "minor" || quality === "diminished" ? value.toLowerCase() + (quality === "diminished" ? "o" : "") : value;
}

export function chordToneWeight(note, chordPitchClasses = []) {
  return chordPitchClasses.map(pitchClass).includes(pitchClass(note)) ? 1 : 0.25;
}
