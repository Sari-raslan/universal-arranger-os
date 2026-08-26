import fs from "node:fs";
import path from "node:path";

/**
 * Independent offline musical sketch renderer.
 * Not V13 Mixer. Not Commander. Not a sine-fixture generator.
 * Oscillators + envelopes + drums playing actual note events.
 * Never sets musicalQualityPass true.
 */
export const RENDER_SCHEMA = "uaos.musical-sketch-render/v1";
export const SAMPLE_RATE = 44100;

export function midiToHz(midi) {
  return 440 * 2 ** ((Number(midi) - 69) / 12);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function osc(type, freq, t, seed = 1) {
  const phase = t * freq;
  if (type === "square") return Math.sign(Math.sin(2 * Math.PI * phase)) * 0.65;
  if (type === "saw") return ((phase % 1) * 2 - 1) * 0.55;
  if (type === "triangle") {
    const x = phase % 1;
    return (x < 0.5 ? x * 4 - 1 : 3 - x * 4) * 0.7;
  }
  if (type === "noise") {
    const x = Math.sin(seed * 12.9898 + t * 43758.5453) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  }
  return Math.sin(2 * Math.PI * phase);
}

function adsr(t, dur, a = 0.012, d = 0.06, s = 0.72, r = 0.08) {
  if (t < 0 || dur <= 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - ((1 - s) * (t - a)) / d;
  if (t < dur - r) return s;
  if (t < dur) return s * (1 - (t - (dur - r)) / r);
  return 0;
}

function voiceGain(voice) {
  if (voice === "bass") return 0.28;
  if (voice === "chord") return 0.14;
  if (voice === "lead") return 0.22;
  if (voice === "kick") return 0.38;
  if (voice === "snare") return 0.22;
  if (voice === "hat") return 0.08;
  return 0.16;
}

function renderEvent(left, right, event, sampleRate) {
  const start = Math.floor(event.startSec * sampleRate);
  const frames = Math.floor(event.durationSec * sampleRate);
  const vel = clamp(Number(event.velocity ?? 0.8), 0.05, 1);
  const pan = clamp(Number(event.pan ?? 0), -1, 1);
  const g = voiceGain(event.voice) * vel;
  for (let i = 0; i < frames; i += 1) {
    const idx = start + i;
    if (idx < 0 || idx >= left.length) continue;
    const t = i / sampleRate;
    const env = adsr(t, event.durationSec, event.attack, event.decay, event.sustain, event.release);
    let sample = 0;
    if (event.voice === "kick") {
      const freq = 110 * Math.exp(-t * 8);
      sample = Math.sin(2 * Math.PI * freq * t) * env;
    } else if (event.voice === "snare") {
      sample = (osc("noise", 0, t, idx + 1) * 0.7 + Math.sin(2 * Math.PI * 190 * t) * 0.3) * env;
    } else if (event.voice === "hat") {
      sample = osc("noise", 0, t, idx + 17) * env * (t < 0.03 ? 1 : 0.35);
    } else {
      sample = osc(event.wave || "triangle", midiToHz(event.midi), t) * env;
    }
    sample *= g;
    left[idx] += sample * (1 - pan) * 0.5 + sample * 0.5;
    right[idx] += sample * (1 + pan) * 0.5 + sample * 0.5;
  }
}

export function analyzeEvents(events) {
  const midis = [...new Set(events.filter((e) => Number.isFinite(e.midi)).map((e) => e.midi))];
  const onsets = [...new Set(events.map((e) => Number(e.startSec.toFixed(4))))];
  const voices = [...new Set(events.map((e) => e.voice))];
  const end = events.reduce((m, e) => Math.max(m, e.startSec + e.durationSec), 0);
  return {
    uniqueMidiCount: midis.length,
    uniqueOnsetCount: onsets.length,
    voices,
    durationSec: end,
    isSingleSineFixture: midis.length <= 1 && onsets.length <= 1
  };
}

export function renderMusicalSketch(events, options = {}) {
  const sampleRate = options.sampleRate || SAMPLE_RATE;
  const stats = analyzeEvents(events);
  if (!events.length) return { ok: false, errorCode: "EMPTY_SCORE" };
  if (stats.uniqueMidiCount < 4) {
    return { ok: false, errorCode: "NOT_MUSICAL_SKETCH", reason: "Need at least 4 distinct pitches for a melody/harmony sketch.", stats };
  }
  if (stats.isSingleSineFixture) {
    return { ok: false, errorCode: "SINE_FIXTURE_REFUSED" };
  }
  if (stats.durationSec < 3.5) return { ok: false, errorCode: "TOO_SHORT", stats };

  const total = Math.ceil((stats.durationSec + 0.15) * sampleRate);
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  for (const event of events) renderEvent(left, right, event, sampleRate);

  let peak = 0;
  for (let i = 0; i < total; i += 1) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  if (peak < 0.02) return { ok: false, errorCode: "SILENT_OR_EMPTY_AUDIO", stats };
  const norm = 0.86 / peak;
  const dataSize = total * 4;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < total; i += 1) {
    buffer.writeInt16LE(clamp(left[i] * norm, -1, 1) * 32767 | 0, 44 + i * 4);
    buffer.writeInt16LE(clamp(right[i] * norm, -1, 1) * 32767 | 0, 44 + i * 4 + 2);
  }
  return {
    ok: true,
    schema: RENDER_SCHEMA,
    format: "wav",
    sampleRate,
    channels: 2,
    bits: 16,
    durationSec: total / sampleRate,
    bytes: buffer.length,
    buffer,
    stats,
    analysis: {
      peakNormalized: 0.86,
      uniqueMidiCount: stats.uniqueMidiCount,
      uniqueOnsetCount: stats.uniqueOnsetCount,
      voices: stats.voices,
      musicalQualityPass: false,
      musicalQualityClaim: false,
      testTone: false,
      sineFixture: false
    }
  };
}

export function writeWavFile(filePath, events, options = {}) {
  const result = renderMusicalSketch(events, options);
  if (!result.ok) return result;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, result.buffer);
  const { buffer, ...rest } = result;
  return { ...rest, wavPath: filePath, bytes: buffer.length };
}
