export const ANALYSIS_VERSION = "uaos-analysis-v3.0.0";

export function analyzeSignal(samples, sampleRate, { threshold = 0.02 } = {}) {
  const values = Array.from(samples || []);
  const duration = values.length / sampleRate;
  const rms = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / Math.max(1, values.length));
  const silence = rms < threshold;
  const onsets = [];
  for (let i = 1; i < values.length; i += Math.max(1, Math.floor(sampleRate / 100))) {
    if (Math.abs(values[i]) - Math.abs(values[i - 1]) > threshold) onsets.push({ time: i / sampleRate, confidence: 0.55, version: ANALYSIS_VERSION });
  }
  return {
    version: ANALYSIS_VERSION,
    duration,
    dynamics: { rms, confidence: values.length ? 0.9 : 0 },
    silence: { value: silence, confidence: silence ? 0.85 : 0.7 },
    onsets,
    tempoEstimate: { bpm: estimateTempoFromOnsets(onsets), confidence: onsets.length > 2 ? 0.45 : 0.1 },
    keyEstimate: { key: "Unknown", confidence: 0 },
    chordTimeline: [],
    sections: []
  };
}

export function estimateTempoFromOnsets(onsets) {
  if (!onsets || onsets.length < 2) return null;
  const intervals = onsets.slice(1).map((onset, index) => onset.time - onsets[index].time).filter((value) => value > 0);
  if (!intervals.length) return null;
  const avg = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  return Math.round(60 / avg);
}

