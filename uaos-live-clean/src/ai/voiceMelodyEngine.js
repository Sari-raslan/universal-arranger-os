import { frequencyToMidi } from "../core/music.js";
import { buildScale, isInScale, pitchClass } from "../music/musicTheory.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

export function classifyVoicing(point, threshold = 0.35) {
  return Boolean(point && point.frequency > 0 && Number(point.confidence || 0) >= threshold);
}

export function smoothPitchContour(points, smoothing = 0.35) {
  let previous = null;
  return points.map((point) => {
    if (!classifyVoicing(point, 0.01)) return { ...point, smoothedFrequency: null, voiced: false };
    previous = previous == null ? point.frequency : previous * smoothing + point.frequency * (1 - smoothing);
    return { ...point, smoothedFrequency: previous, voiced: true };
  });
}

export function correctOctaveJumps(points, semitoneLimit = 7) {
  let previous = null;
  return points.map((point) => {
    if (!point.smoothedFrequency) return point;
    let midi = frequencyToMidi(point.smoothedFrequency);
    if (previous != null) {
      while (midi - previous > semitoneLimit) midi -= 12;
      while (previous - midi > semitoneLimit) midi += 12;
    }
    previous = midi;
    return { ...point, midi };
  });
}

export function segmentMelodyNotes(points, {
  minDuration = 0.08,
  silenceGap = 0.06,
  pitchChange = 1,
  pitchRange = [0, 127],
} = {}) {
  const notes = [];
  let current = null;
  let lastVoicedTime = null;

  function close(endTime) {
    if (current && endTime - current.start >= minDuration) {
      notes.push({
        ...current,
        end: endTime,
        duration: endTime - current.start,
        velocity: clamp(Math.round(35 + current.confidence * 88), 1, 127),
      });
    }
    current = null;
  }

  for (const point of points) {
    if (!point.voiced || !Number.isFinite(point.midi) || point.midi < pitchRange[0] || point.midi > pitchRange[1]) {
      if (lastVoicedTime != null && point.time - lastVoicedTime >= silenceGap) close(lastVoicedTime);
      continue;
    }
    const midi = clamp(Math.round(point.midi), 0, 127);
    if (!current || Math.abs(current.midi - midi) > pitchChange) {
      close(point.time);
      current = { start: point.time, midi, confidence: Number(point.confidence || 0), pitchConfidence: Number(point.confidence || 0) };
    } else {
      current.confidence = Math.min(current.confidence, Number(point.confidence || current.confidence));
    }
    lastVoicedTime = point.time;
  }
  close(points.at(-1)?.time || 0);
  return notes;
}

export function quantizeMelody(notes, { bpm = 120, subdivision = 4, swing = 0 } = {}) {
  const beat = 60 / Math.max(1, Number(bpm || 120));
  const grid = beat / Math.max(1, Number(subdivision || 4));
  return notes.map((note) => {
    const rawStep = Math.round(note.start / grid);
    const swingOffset = rawStep % 2 === 1 ? grid * clamp(swing, 0, 0.45) : 0;
    const start = Math.max(0, rawStep * grid + swingOffset);
    const duration = Math.max(grid, Math.round(note.duration / grid) * grid);
    return { ...note, start, end: start + duration, duration, quantized: true };
  });
}

export function snapMelodyToScale(notes, { root = 0, mode = "major" } = {}) {
  const scale = buildScale(root, mode === "minor" ? "naturalMinor" : mode);
  return notes.map((note) => {
    if (isInScale(note.midi, root, mode === "minor" ? "naturalMinor" : mode)) return { ...note, snapped: false };
    let best = note.midi;
    let distance = Infinity;
    for (let candidate = note.midi - 6; candidate <= note.midi + 6; candidate += 1) {
      if (scale.includes(pitchClass(candidate)) && Math.abs(candidate - note.midi) < distance) {
        best = candidate;
        distance = Math.abs(candidate - note.midi);
      }
    }
    return { ...note, midi: clamp(best, 0, 127), snapped: true };
  });
}

export function transposeMelody(notes, semitones = 0, pitchRange = [0, 127]) {
  return notes.map((note) => ({
    ...note,
    midi: clamp(note.midi + Number(semitones || 0), pitchRange[0], pitchRange[1]),
  }));
}

export function melodyToMidiEvents(notes, { channel = 1, ppq = 480, bpm = 120 } = {}) {
  const secondsToTicks = (seconds) => Math.max(0, Math.round((seconds / (60 / bpm)) * ppq));
  return notes.flatMap((note) => {
    const midi = clamp(Math.round(note.midi), 0, 127);
    const startTick = secondsToTicks(note.start);
    const durationTicks = Math.max(1, secondsToTicks(note.duration));
    const velocity = clamp(Math.round(note.velocity || 80), 1, 127);
    return [
      { type: "noteOn", tick: startTick, note: midi, velocity, channel },
      { type: "noteOff", tick: startTick + durationTicks, note: midi, velocity: 0, channel },
    ];
  }).sort((a, b) => a.tick - b.tick || (a.type === "noteOff" ? -1 : 1));
}

export function voiceToMelody(points, options = {}) {
  if (!Array.isArray(points)) return { ok: false, error: "Pitch contour must be an array.", notes: [], events: [] };
  const smoothed = correctOctaveJumps(smoothPitchContour(points, options.smoothing));
  let notes = segmentMelodyNotes(smoothed, options);
  if (options.scaleSnap) notes = snapMelodyToScale(notes, options.scaleSnap);
  if (options.transpose) notes = transposeMelody(notes, options.transpose, options.pitchRange || [0, 127]);
  if (options.quantize !== false) notes = quantizeMelody(notes, options);
  return {
    ok: true,
    monophonic: true,
    polyphonicTranscription: false,
    notes,
    events: melodyToMidiEvents(notes, options),
    exportContract: { json: true, midi: true, localDownloadOnly: true, upload: false },
  };
}
