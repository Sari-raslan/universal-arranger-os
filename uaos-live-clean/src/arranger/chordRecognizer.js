const NOTE_NAMES = Object.freeze([
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]);

const CHORD_TEMPLATES = Object.freeze([
  { quality: "maj7", intervals: [0, 4, 7, 11], score: 7 },
  { quality: "7", intervals: [0, 4, 7, 10], score: 7 },
  { quality: "min7", intervals: [0, 3, 7, 10], score: 7 },
  { quality: "dim7", intervals: [0, 3, 6, 9], score: 7 },
  { quality: "major", intervals: [0, 4, 7], score: 6 },
  { quality: "minor", intervals: [0, 3, 7], score: 6 },
  { quality: "diminished", intervals: [0, 3, 6], score: 6 },
  { quality: "augmented", intervals: [0, 4, 8], score: 6 },
  { quality: "sus2", intervals: [0, 2, 7], score: 5 },
  { quality: "sus4", intervals: [0, 5, 7], score: 5 },
  { quality: "power", intervals: [0, 7], score: 3 },
]);

const QUALITY_SYMBOLS = Object.freeze({
  major: "",
  minor: "m",
  diminished: "dim",
  augmented: "aug",
  sus2: "sus2",
  sus4: "sus4",
  power: "5",
  "7": "7",
  maj7: "maj7",
  min7: "m7",
  dim7: "dim7",
});

function uniquePitchClasses(notes) {
  return [...new Set(
    notes
      .filter((note) => Number.isFinite(Number(note)))
      .map((note) => ((Number(note) % 12) + 12) % 12),
  )].sort((a, b) => a - b);
}

function normalizeIntervals(pitchClasses, root) {
  return pitchClasses
    .map((pitchClass) => (pitchClass - root + 12) % 12)
    .sort((a, b) => a - b);
}

function templateMatches(intervals, templateIntervals) {
  return templateIntervals.every((interval) => intervals.includes(interval));
}

export function midiNoteName(note) {
  const midi = Math.min(127, Math.max(0, Math.round(Number(note))));
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${octave}`;
}

export function recognizeChord(notes) {
  const normalizedNotes = notes
    .filter((note) => Number.isFinite(Number(note)))
    .map(Number)
    .sort((a, b) => a - b);

  if (normalizedNotes.length === 0) {
    return {
      name: "No chord",
      root: null,
      bass: null,
      quality: "none",
      confidence: 0,
      notes: [],
    };
  }

  const pitchClasses = uniquePitchClasses(normalizedNotes);
  const bass = normalizedNotes[0];
  let best = null;

  for (const root of pitchClasses) {
    const intervals = normalizeIntervals(pitchClasses, root);

    for (const template of CHORD_TEMPLATES) {
      if (!templateMatches(intervals, template.intervals)) {
        continue;
      }

      const extraNotes = intervals.filter(
        (interval) => !template.intervals.includes(interval),
      ).length;
      const rootPresent = pitchClasses.includes(root) ? 1 : 0;
      const bassBonus = bass % 12 === root ? 1 : 0;
      const score = template.score + rootPresent + bassBonus - extraNotes;

      if (!best || score > best.score) {
        best = {
          root,
          quality: template.quality,
          score,
          matchedIntervals: template.intervals,
          extraNotes,
        };
      }
    }
  }

  if (!best) {
    const root = pitchClasses[0];

    return {
      name: `${NOTE_NAMES[root]}(cluster)`,
      root,
      bass,
      quality: "cluster",
      confidence: 0.25,
      notes: normalizedNotes,
    };
  }

  const slashBass = bass % 12 !== best.root
    ? `/${NOTE_NAMES[bass % 12]}`
    : "";

  const symbol = QUALITY_SYMBOLS[best.quality] ?? best.quality;
  const confidence = Math.max(
    0,
    Math.min(
      1,
      (best.matchedIntervals.length - best.extraNotes * 0.5) /
        Math.max(3, pitchClasses.length),
    ),
  );

  return {
    name: `${NOTE_NAMES[best.root]}${symbol}${slashBass}`,
    root: best.root,
    bass,
    quality: best.quality,
    confidence,
    notes: normalizedNotes,
  };
}

export function transposeChord(chord, semitones) {
  if (!chord || chord.root == null) {
    return chord;
  }

  const amount = Number(semitones) || 0;
  const nextRoot = (chord.root + amount + 12) % 12;
  const nextBass = chord.bass == null ? null : chord.bass + amount;

  return {
    ...chord,
    root: nextRoot,
    bass: nextBass,
    notes: chord.notes.map((note) => note + amount),
    name: recognizeChord(chord.notes.map((note) => note + amount)).name,
  };
}