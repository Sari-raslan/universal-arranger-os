import { detectChord, detectKey, pitchClass } from "../music/musicTheory.js";
import { estimateMaqamFromPitchClassProfile } from "../music/orientalTheory.js";

export const AUDIO_ANALYSIS_SCHEMA_VERSION = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

export function normalizePcmBuffer(input, { channels = 1, sampleRate = 44100 } = {}) {
  if (!input || typeof input.length !== "number") {
    throw new TypeError("PCM input must be an array-like buffer.");
  }
  const raw = Array.from(input, Number).map((value) => (Number.isFinite(value) ? value : 0));
  const peak = raw.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  const scale = peak > 1 ? peak : 1;
  const samples = raw.map((value) => clamp(value / scale, -1, 1));
  return {
    samples,
    channels: Math.max(1, Number(channels || 1)),
    sampleRate: Math.max(1, Number(sampleRate || 44100)),
    duration: samples.length / Math.max(1, Number(sampleRate || 44100)) / Math.max(1, Number(channels || 1)),
    normalized: peak > 1,
  };
}

export function toMono(input, channels = 1) {
  const samples = Array.from(input || [], Number);
  const channelCount = Math.max(1, Number(channels || 1));
  if (channelCount === 1) return samples;
  const frames = [];
  for (let index = 0; index < samples.length; index += channelCount) {
    let sum = 0;
    for (let channel = 0; channel < channelCount; channel += 1) sum += samples[index + channel] || 0;
    frames.push(sum / channelCount);
  }
  return frames;
}

export function basicLevels(samples, silenceThreshold = 0.01) {
  const values = Array.from(samples || [], Number);
  const sumSquares = values.reduce((sum, value) => sum + value * value, 0);
  const rms = Math.sqrt(sumSquares / Math.max(1, values.length));
  const peak = values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  return {
    rms,
    peak,
    clipping: peak >= 0.98,
    silence: rms < silenceThreshold,
    silenceThreshold,
  };
}

export function extractFrames(samples, { frameSize = 1024, hopSize = 512 } = {}) {
  const values = Array.from(samples || [], Number);
  const frames = [];
  for (let start = 0; start + frameSize <= values.length; start += hopSize) {
    frames.push({ start, samples: values.slice(start, start + frameSize) });
  }
  if (!frames.length && values.length) frames.push({ start: 0, samples: values });
  return frames;
}

export function applyHannWindow(samples) {
  const values = Array.from(samples || [], Number);
  const size = Math.max(1, values.length - 1);
  return values.map((value, index) => value * 0.5 * (1 - Math.cos((2 * Math.PI * index) / size)));
}

export function spectralMagnitude(samples, bins = 64) {
  const values = applyHannWindow(samples);
  const output = [];
  for (let bin = 0; bin < bins; bin += 1) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < values.length; n += 1) {
      const angle = (2 * Math.PI * bin * n) / Math.max(1, values.length);
      real += values[n] * Math.cos(angle);
      imag -= values[n] * Math.sin(angle);
    }
    output.push(Math.sqrt(real * real + imag * imag) / Math.max(1, values.length));
  }
  return output;
}

export function spectralCentroid(magnitudes, sampleRate) {
  const mags = Array.from(magnitudes || [], Number);
  const total = mags.reduce((sum, value) => sum + value, 0);
  if (!total) return 0;
  const weighted = mags.reduce((sum, value, index) => sum + value * index, 0);
  return (weighted / total) * (sampleRate / 2) / Math.max(1, mags.length - 1);
}

export function zeroCrossingRate(samples) {
  const values = Array.from(samples || [], Number);
  if (values.length < 2) return 0;
  let crossings = 0;
  for (let index = 1; index < values.length; index += 1) {
    if ((values[index - 1] >= 0 && values[index] < 0) || (values[index - 1] < 0 && values[index] >= 0)) crossings += 1;
  }
  return crossings / (values.length - 1);
}

export function energyCurve(frames, sampleRate, hopSize = 512) {
  return frames.map((frame) => ({
    time: frame.start / sampleRate,
    energy: basicLevels(frame.samples).rms,
    frame: Math.round(frame.start / Math.max(1, hopSize)),
  }));
}

export function detectTransients(curve, threshold = 1.6) {
  const transients = [];
  for (let index = 1; index < curve.length; index += 1) {
    const previous = curve[index - 1].energy || 0.0001;
    const ratio = curve[index].energy / previous;
    if (ratio >= threshold && curve[index].energy > 0.015) {
      transients.push({ time: curve[index].time, energy: curve[index].energy, confidence: Math.min(0.9, ratio / 4) });
    }
  }
  return transients;
}

export function detectSampleImpulses(samples, sampleRate, threshold = 0.55) {
  const values = Array.from(samples || [], Number);
  const impulses = [];
  let lastIndex = -Infinity;
  const minimumGap = Math.max(1, Math.floor(sampleRate * 0.18));
  for (let index = 1; index < values.length; index += 1) {
    const previous = Math.abs(values[index - 1]);
    const current = Math.abs(values[index]);
    if (current >= threshold && current - previous > threshold * 0.35 && index - lastIndex >= minimumGap) {
      impulses.push({ time: index / sampleRate, energy: current, confidence: Math.min(0.9, current) });
      lastIndex = index;
    }
  }
  return impulses;
}

export function tempoCandidatesFromOnsets(onsets) {
  if (!Array.isArray(onsets) || onsets.length < 2) return [];
  const histogram = new Map();
  for (let index = 1; index < onsets.length; index += 1) {
    const delta = onsets[index].time - onsets[index - 1].time;
    if (delta <= 0) continue;
    let bpm = 60 / delta;
    while (bpm < 70) bpm *= 2;
    while (bpm > 190) bpm /= 2;
    const rounded = Math.round(bpm);
    histogram.set(rounded, (histogram.get(rounded) || 0) + 1);
  }
  return [...histogram.entries()]
    .map(([bpm, votes]) => ({ bpm, votes, confidence: Math.min(0.95, votes / Math.max(1, onsets.length - 1)) }))
    .sort((a, b) => b.votes - a.votes || a.bpm - b.bpm);
}

export function beatGrid(bpm, duration, offset = 0) {
  if (!bpm) return [];
  const step = 60 / bpm;
  const beats = [];
  for (let time = offset; time <= duration + 0.0001; time += step) {
    beats.push({ time: Number(time.toFixed(4)), beat: beats.length + 1, downbeatCandidate: beats.length % 4 === 0 });
  }
  return beats;
}

export function pitchClassProfileFromNotes(notes = []) {
  const profile = Array.from({ length: 12 }, () => 0);
  for (const note of notes) {
    const midi = typeof note === "number" ? note : note.midi ?? note.note;
    const weight = typeof note === "number" ? 1 : Number(note.duration || 1) * Number(note.confidence || 1);
    if (Number.isFinite(midi)) profile[pitchClass(midi)] += weight;
  }
  return profile;
}

export function detectChordTimeline(notes = [], windowSeconds = 2) {
  const duration = notes.reduce((max, note) => Math.max(max, Number(note.end ?? note.start + note.duration ?? 0)), 0);
  const timeline = [];
  for (let start = 0; start <= duration; start += windowSeconds) {
    const end = start + windowSeconds;
    const active = notes.filter((note) => (note.start ?? 0) < end && (note.end ?? ((note.start ?? 0) + (note.duration ?? 0))) > start);
    const chord = detectChord(active.map((note) => note.midi ?? note.note));
    timeline.push({ start, end, ...chord });
  }
  return timeline.filter((item) => item.confidence > 0);
}

export function sectionBoundariesFromEnergy(curve, duration) {
  if (!curve.length) return [{ id: "section-1", start: 0, end: duration, label: "full-song", confidence: 0.2 }];
  const boundaries = [0];
  for (let index = 4; index < curve.length - 4; index += 1) {
    const before = curve.slice(Math.max(0, index - 4), index).reduce((sum, item) => sum + item.energy, 0) / 4;
    const after = curve.slice(index, index + 4).reduce((sum, item) => sum + item.energy, 0) / 4;
    if (Math.abs(after - before) > 0.08 && curve[index].time - boundaries.at(-1) > 4) boundaries.push(curve[index].time);
  }
  if (boundaries.at(-1) < duration) boundaries.push(duration);
  return boundaries.slice(0, -1).map((start, index) => ({
    id: `section-${index + 1}`,
    start,
    end: boundaries[index + 1],
    label: ["intro", "verse", "chorus", "bridge", "outro"][Math.min(index, 4)],
    experimental: true,
    confidence: Math.min(0.72, 0.25 + index * 0.08),
  }));
}

export function analyzeAudioBuffer(input, options = {}) {
  try {
    const normalized = normalizePcmBuffer(input, options);
    const mono = toMono(normalized.samples, normalized.channels);
    const levels = basicLevels(mono, options.silenceThreshold);
    const frameSize = options.frameSize || 1024;
    const hopSize = options.hopSize || 512;
    const frames = extractFrames(mono, { frameSize, hopSize });
    const firstSpectrum = spectralMagnitude(frames[0]?.samples || [], options.spectralBins || 64);
    const curve = energyCurve(frames, normalized.sampleRate, hopSize);
    let onsets = detectTransients(curve);
    if (onsets.length < 2) {
      onsets = detectSampleImpulses(mono, normalized.sampleRate);
    }
    const tempoCandidates = tempoCandidatesFromOnsets(onsets);
    const tempo = tempoCandidates[0] || { bpm: null, confidence: 0 };
    const notes = options.notes || [];
    const profile = pitchClassProfileFromNotes(notes);
    const key = detectKey(profile);
    const maqam = estimateMaqamFromPitchClassProfile(profile);
    return {
      schemaVersion: AUDIO_ANALYSIS_SCHEMA_VERSION,
      ok: true,
      sampleRate: normalized.sampleRate,
      channels: normalized.channels,
      duration: normalized.duration,
      levels,
      frames: { count: frames.length, frameSize, hopSize },
      spectral: {
        magnitudes: firstSpectrum,
        centroid: spectralCentroid(firstSpectrum, normalized.sampleRate),
        zeroCrossingRate: zeroCrossingRate(frames[0]?.samples || mono),
      },
      energyCurve: curve,
      onsets,
      tempo: { bpm: tempo.bpm, confidence: tempo.confidence || 0, candidates: tempoCandidates },
      beatGrid: beatGrid(tempo.bpm, normalized.duration),
      downbeats: beatGrid(tempo.bpm, normalized.duration).filter((beat) => beat.downbeatCandidate),
      pitchClassProfile: profile,
      key,
      maqam,
      chordTimeline: detectChordTimeline(notes),
      sections: sectionBoundariesFromEnergy(curve, normalized.duration),
      globalConfidence: Math.min(0.86, (tempo.confidence || 0) * 0.35 + key.confidence * 0.35 + (levels.silence ? 0 : 0.2)),
      warnings: levels.silence ? ["Input appears silent. Analysis uses deterministic fallback."] : [],
    };
  } catch (error) {
    return { schemaVersion: AUDIO_ANALYSIS_SCHEMA_VERSION, ok: false, error: { message: error.message }, warnings: ["Unsupported or invalid audio input."] };
  }
}
