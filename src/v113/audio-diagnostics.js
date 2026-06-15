export function analyzeAudioFrame(samples, { silenceThreshold = 0.0005, clippingThreshold = 0.999 } = {}) {
  if (!ArrayBuffer.isView(samples) && !Array.isArray(samples)) {
    throw new TypeError("samples must be an array or typed array");
  }

  if (samples.length === 0) {
    return {
      sampleCount: 0,
      peak: 0,
      rms: 0,
      silent: true,
      clipped: false,
    };
  }

  let peak = 0;
  let sumSquares = 0;

  for (const raw of samples) {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new TypeError("samples must contain finite numbers");
    }

    const absolute = Math.abs(value);
    peak = Math.max(peak, absolute);
    sumSquares += value * value;
  }

  const rms = Math.sqrt(sumSquares / samples.length);

  return {
    sampleCount: samples.length,
    peak,
    rms,
    silent: rms <= silenceThreshold,
    clipped: peak >= clippingThreshold,
  };
}