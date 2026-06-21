export const UAOS_SAMPLER_ENGINE_VERSION = "1.0.0-local-foundation";

export function createSamplerState() {
  return {
    status: "idle",
    loadedPreset: null,
    selectedArticulation: "sustain",
    lastPreview: null,
    safety: {
      mode: "browser-preview-mock-only",
      realAudioFiles: false,
      realKeyboardOutput: false,
      realKeyboardWriter: false,
      productionParser: false
    }
  };
}

export function loadInstrumentPreset(preset) {
  if (!preset || preset.format !== "UAOS_INSTRUMENT_PRESET") {
    throw new Error("Invalid UAOS instrument preset.");
  }

  return {
    status: "preset-loaded",
    loadedPreset: preset,
    selectedArticulation: preset.articulations?.[0] || "sustain",
    zoneCount: Array.isArray(preset.zones) ? preset.zones.length : 0,
    safety: {
      mode: "metadata-only",
      samplePolicy: preset.samplePolicy || "unknown"
    }
  };
}

export function findZoneForNote(preset, note, velocity = 100, articulation = null) {
  if (!preset || !Array.isArray(preset.zones)) {
    return null;
  }

  return preset.zones.find((zone) => {
    const noteOk = note >= zone.noteMin && note <= zone.noteMax;
    const velocityOk = velocity >= zone.velocityMin && velocity <= zone.velocityMax;
    const articulationOk = articulation ? zone.articulation === articulation : true;
    return noteOk && velocityOk && articulationOk;
  }) || null;
}

export function mapVelocityLayer(preset, velocity = 100) {
  const layers = preset?.velocityLayers || [];
  return layers.find((layer) => {
    return velocity >= layer.velocityMin && velocity <= layer.velocityMax;
  }) || null;
}

export function getAdsrEnvelope(preset) {
  return preset?.adsr || {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.25
  };
}

export function selectArticulation(preset, articulationId) {
  const articulations = preset?.articulations || [];
  if (!articulations.includes(articulationId)) {
    return {
      ok: false,
      articulation: null,
      reason: "Articulation not available in preset."
    };
  }

  return {
    ok: true,
    articulation: articulationId
  };
}

export function createBrowserPreviewMock({ preset, note = 60, velocity = 100, articulation = null }) {
  const selectedArticulation = articulation || preset?.articulations?.[0] || "sustain";
  const zone = findZoneForNote(preset, note, velocity, selectedArticulation) || findZoneForNote(preset, note, velocity, null);
  const velocityLayer = mapVelocityLayer(preset, velocity);
  const adsr = getAdsrEnvelope(preset);

  return {
    format: "UAOS_BROWSER_PREVIEW_MOCK",
    engineVersion: UAOS_SAMPLER_ENGINE_VERSION,
    realAudioPlayback: false,
    note,
    velocity,
    articulation: selectedArticulation,
    zone,
    velocityLayer,
    adsr,
    message: "Safe mock preview only. No real sample loading and no keyboard output."
  };
}
