export function selectSample({ samples = [], note, velocity = 100, articulation = "sustain", maqam = null }) {
  return samples.find(sample =>
    sample.note === note &&
    velocity >= (sample.velocityMin ?? 0) &&
    velocity <= (sample.velocityMax ?? 127) &&
    (!sample.articulation || sample.articulation === articulation) &&
    (!sample.maqamHint || !maqam || sample.maqamHint === maqam)
  ) || samples.find(sample => sample.note === note) || null;
}

export function createSamplerManifest(name = "uaos-sampler-library") {
  return {
    name,
    format: "UAOS_SAMPLER_LIBRARY",
    version: "0.1.0",
    license: "original-or-licensed-only",
    instruments: []
  };
}
