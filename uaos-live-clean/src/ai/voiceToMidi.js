import { frequencyToMidi } from "../core/music.js";

export function segmentPitchContour(points, { minDuration = 0.08, silenceConfidence = 0.2, smoothing = 0.35 } = {}) {
  const notes = [];
  let current = null;
  let smoothed = null;

  for (const point of points) {
    if (!point.frequency || point.confidence <= silenceConfidence) {
      close(point.time);
      continue;
    }
    smoothed = smoothed == null ? point.frequency : smoothed * smoothing + point.frequency * (1 - smoothing);
    const midi = frequencyToMidi(smoothed);
    if (midi == null) continue;
    if (!current || Math.abs(current.midi - midi) > 1) {
      close(point.time);
      current = { start: point.time, end: point.time, midi, confidence: point.confidence, velocity: velocityFromConfidence(point.confidence) };
    } else {
      current.end = point.time;
      current.confidence = Math.min(current.confidence, point.confidence);
    }
  }
  close(points.at(-1)?.time || 0);

  function close(time) {
    if (current && time - current.start >= minDuration) {
      notes.push({ ...current, duration: time - current.start });
    }
    current = null;
  }

  return notes;
}

export function quantizeNotes(notes, gridSeconds = 0.125) {
  return notes.map((note) => ({
    ...note,
    start: Math.round(note.start / gridSeconds) * gridSeconds,
    duration: Math.max(gridSeconds, Math.round(note.duration / gridSeconds) * gridSeconds)
  }));
}

function velocityFromConfidence(confidence) {
  return Math.max(24, Math.min(120, Math.round(40 + confidence * 80)));
}

