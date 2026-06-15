import {
  createInstrumentPreset,
  normalizeSampleZone,
  selectSampleZone,
  validateInstrumentPreset,
} from "./instrumentPreset.js";

export const SAMPLER_PRESET_SCHEMA_VERSION = 2;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

export function migrateSamplerPreset(preset) {
  if (!preset || typeof preset !== "object") {
    throw new Error("Preset must be an object.");
  }

  if (!preset.schemaVersion || preset.schemaVersion === 1) {
    const legacy = createInstrumentPreset(preset);
    return {
      ...legacy,
      schemaVersion: SAMPLER_PRESET_SCHEMA_VERSION,
      mode: preset.mode || "gated",
      oneShot: Boolean(preset.oneShot),
      drumMap: preset.drumMap || {},
      chokeGroups: preset.chokeGroups || {},
      loop: preset.loop || { enabled: false, start: 0, end: 0 },
      legal: preset.legal || {
        source: "user-local-or-original-uaos",
        commercialCopy: false,
      },
    };
  }

  return {
    schemaVersion: SAMPLER_PRESET_SCHEMA_VERSION,
    name: String(preset.name || "UAOS Instrument"),
    createdAt: preset.createdAt || new Date().toISOString(),
    masterGain: clamp(preset.masterGain ?? 0.9, 0, 2),
    envelope: {
      attack: clamp(preset.envelope?.attack ?? 0.01, 0, 10),
      decay: clamp(preset.envelope?.decay ?? 0.12, 0, 10),
      sustain: clamp(preset.envelope?.sustain ?? 0.82, 0, 1),
      release: clamp(preset.envelope?.release ?? 0.35, 0.01, 20),
    },
    filter: {
      type: String(preset.filter?.type || "lowpass"),
      cutoff: clamp(preset.filter?.cutoff ?? 18000, 20, 22000),
      resonance: clamp(preset.filter?.resonance ?? 0.7, 0.0001, 40),
    },
    mode: ["gated", "one-shot"].includes(preset.mode) ? preset.mode : "gated",
    oneShot: Boolean(preset.oneShot || preset.mode === "one-shot"),
    drumMap: preset.drumMap && typeof preset.drumMap === "object" ? { ...preset.drumMap } : {},
    chokeGroups: preset.chokeGroups && typeof preset.chokeGroups === "object" ? { ...preset.chokeGroups } : {},
    loop: {
      enabled: Boolean(preset.loop?.enabled),
      start: Math.max(0, Number(preset.loop?.start || 0)),
      end: Math.max(0, Number(preset.loop?.end || 0)),
    },
    legal: {
      source: String(preset.legal?.source || "user-local-or-original-uaos"),
      commercialCopy: Boolean(preset.legal?.commercialCopy),
    },
    samples: Array.isArray(preset.samples)
      ? preset.samples.map((sample, index) => normalizeSampleZone(sample, index))
      : [],
  };
}

export function validateSamplerPreset(preset) {
  const migrated = (() => {
    try {
      return migrateSamplerPreset(preset);
    } catch (error) {
      return { error: error.message };
    }
  })();

  if (migrated.error) {
    return { valid: false, errors: [migrated.error] };
  }

  const base = validateInstrumentPreset({ ...migrated, schemaVersion: 1 });
  const errors = [...base.errors];

  if (migrated.legal.commercialCopy) {
    errors.push("Commercial audio may not be copied into a UAOS preset.");
  }

  for (const sample of migrated.samples) {
    if (sample.keyLow > sample.keyHigh) errors.push(`${sample.id} keyLow exceeds keyHigh.`);
    if (sample.velocityLow > sample.velocityHigh) errors.push(`${sample.id} velocityLow exceeds velocityHigh.`);
  }

  return { valid: errors.length === 0, errors, preset: migrated };
}

export class SampleCache {
  constructor({ decodeAudioData } = {}) {
    this.decodeAudioData = decodeAudioData;
    this.buffers = new Map();
    this.errors = new Map();
  }

  async loadArrayBuffer(id, arrayBuffer) {
    if (!this.decodeAudioData) {
      const error = new Error("decodeAudioData is not available in this runtime.");
      this.errors.set(id, error.message);
      throw error;
    }

    try {
      const decoded = await this.decodeAudioData(arrayBuffer.slice(0));
      this.buffers.set(id, decoded);
      this.errors.delete(id);
      return decoded;
    } catch (error) {
      this.errors.set(id, error.message);
      throw new Error(`WAV decode failed for ${id}: ${error.message}`);
    }
  }

  get(id) {
    return this.buffers.get(id) || null;
  }

  has(id) {
    return this.buffers.has(id);
  }

  clear() {
    this.buffers.clear();
    this.errors.clear();
  }
}

export class SamplerEngine {
  constructor({ audioEngine = null, sampleCache = new SampleCache() } = {}) {
    this.audioEngine = audioEngine;
    this.sampleCache = sampleCache;
    this.preset = migrateSamplerPreset(createInstrumentPreset());
    this.cursor = 0;
  }

  loadPreset(preset) {
    const validation = validateSamplerPreset(preset);
    if (!validation.valid) {
      throw new Error(validation.errors.join(" "));
    }
    this.preset = validation.preset;
    return this.preset;
  }

  assignDecodedSample(sampleId, buffer) {
    this.sampleCache.buffers.set(sampleId, buffer);
    this.preset = {
      ...this.preset,
      samples: this.preset.samples.map((sample) =>
        sample.id === sampleId ? { ...sample, loaded: true } : sample,
      ),
    };
  }

  select(note, velocity) {
    const mappedNote = this.preset.drumMap[note] ?? note;
    const selection = selectSampleZone(this.preset.samples, mappedNote, velocity, this.cursor);
    this.cursor = selection.nextCursor;
    return { ...selection, note: mappedNote };
  }

  noteOn(note, velocity = 100, startedAt = 0) {
    const selection = this.select(note, velocity);
    if (!selection.item) {
      return {
        ok: false,
        reason: this.preset.samples.length ? "missing-zone-or-sample" : "empty-preset",
      };
    }

    const allocation = this.audioEngine?.allocateVoice({
      note: selection.note,
      velocity,
      sampleId: selection.item.id,
      chokeGroup: this.preset.chokeGroups[selection.item.id] || null,
      startedAt,
    });

    return {
      ok: true,
      sample: selection.item,
      buffer: this.sampleCache.get(selection.item.id),
      allocation,
      oneShot: this.preset.oneShot,
    };
  }

  noteOff(note) {
    return this.preset.oneShot ? [] : this.audioEngine?.noteOff(note) || [];
  }

  panic() {
    return this.audioEngine?.panic() || [];
  }
}
