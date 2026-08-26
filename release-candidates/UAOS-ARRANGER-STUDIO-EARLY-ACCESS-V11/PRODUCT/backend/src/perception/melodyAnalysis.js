/**
 * Shared monophonic melody perception. Deterministic, local, no ML.
 * Detected notes are analysis fixtures, not owner listening proof.
 */
export const MELODY_ANALYSIS_SCHEMA = "uaos.melody-analysis/v1";

function parseWavPcm16Mono(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 44) return { ok: false, errorCode: "CORRUPT_WAV" };
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    return { ok: false, errorCode: "CORRUPT_WAV" };
  }
  let offset = 12;
  let format;
  let channels;
  let bits;
  let sampleRate;
  let dataOffset;
  let dataLength;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      format = buffer.readUInt16LE(offset + 8);
      channels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      bits = buffer.readUInt16LE(offset + 22);
    }
    if (id === "data") {
      dataOffset = offset + 8;
      dataLength = Math.min(length, buffer.length - dataOffset);
      break;
    }
    offset += 8 + length + (length & 1);
  }
  if (format !== 1 || bits !== 16 || !dataOffset || !channels || !dataLength) {
    return { ok: false, errorCode: "UNSUPPORTED_OR_CORRUPT_WAV" };
  }
  const frames = Math.floor(dataLength / 2 / channels);
  const samples = new Float32Array(frames);
  let peak = 0;
  for (let i = 0; i < frames; i += 1) {
    const s = buffer.readInt16LE(dataOffset + i * channels * 2) / 32768;
    samples[i] = s;
    const a = Math.abs(s);
    if (a > peak) peak = a;
  }
  return { ok: true, sampleRate, channels, samples, peak };
}

function hzToMidi(hz) {
  return 69 + 12 * Math.log2(hz / 440);
}

function estimatePitchHz(frame, sampleRate) {
  const minLag = Math.floor(sampleRate / 1000);
  const maxLag = Math.min(Math.floor(sampleRate / 80), frame.length - 1);
  let bestLag = 0;
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    const n = frame.length - lag;
    for (let i = 0; i < n; i += 1) sum += frame[i] * frame[i + lag];
    if (sum > best) {
      best = sum;
      bestLag = lag;
    }
  }
  if (!bestLag || best <= 0) return null;
  return sampleRate / bestLag;
}

export function analyzeMonophonicWav(buffer, options = {}) {
  const parsed = parseWavPcm16Mono(buffer);
  if (!parsed.ok) return parsed;
  if (parsed.peak < 0.01) {
    return { ok: false, errorCode: "SILENT_OR_EMPTY_AUDIO", musicalQualityClaim: false };
  }
  const window = Math.min(parsed.samples.length, options.windowSize || 2048);
  const hop = options.hopSize || 1024;
  const notes = [];
  for (let start = 0; start + window <= parsed.samples.length; start += hop) {
    const slice = parsed.samples.subarray(start, start + window);
    const hz = estimatePitchHz(slice, parsed.sampleRate);
    if (!hz) continue;
    const midi = Math.round(hzToMidi(hz));
    if (midi < 36 || midi > 96) continue;
    const last = notes[notes.length - 1];
    if (last && last.midi === midi) {
      last.frames += 1;
    } else {
      notes.push({ midi, hz, frames: 1, startSample: start });
    }
  }
  return {
    ok: true,
    schema: MELODY_ANALYSIS_SCHEMA,
    sampleRate: parsed.sampleRate,
    channels: parsed.channels,
    notes,
    musicalQualityClaim: false,
    note: "Pitch estimates are analysis fixtures, not owner listening proof."
  };
}

export function writePcm16MonoSine(frequencyHz, durationSec, sampleRate = 44100) {
  const frames = Math.floor(durationSec * sampleRate);
  const dataSize = frames * 2;
  const b = Buffer.alloc(44 + dataSize);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + dataSize, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sampleRate, 24);
  b.writeUInt32LE(sampleRate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < frames; i += 1) {
    const s = Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate) * 0.4;
    b.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  return b;
}
