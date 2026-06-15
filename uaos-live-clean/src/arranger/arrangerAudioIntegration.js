import { ARRANGER_LANES, normalizeOpenStyle } from "./openStyleEngine.js";

export const DEFAULT_ARRANGER_PART_ASSIGNMENTS = Object.freeze({
  drums: { presetId: "uaos-drum-kit-demo", role: "drum-kit", midiChannel: 10 },
  percussion: { presetId: "uaos-drum-kit-demo", role: "drum-kit", midiChannel: 10 },
  bass: { presetId: "uaos-bass-demo", role: "bass", midiChannel: 2 },
  chord1: { presetId: "uaos-poly-demo", role: "polyphonic-chord", midiChannel: 3 },
  chord2: { presetId: "uaos-poly-demo", role: "polyphonic-chord", midiChannel: 4 },
  pad: { presetId: "uaos-pad-demo", role: "pad", midiChannel: 5 },
  phrase1: { presetId: "uaos-phrase-demo", role: "phrase", midiChannel: 6 },
  phrase2: { presetId: "uaos-phrase-demo", role: "phrase", midiChannel: 7 },
});

export function normalizeArrangerAssignments(assignments = {}) {
  return Object.fromEntries(ARRANGER_LANES.map((lane) => {
    const source = assignments[lane] || DEFAULT_ARRANGER_PART_ASSIGNMENTS[lane];
    return [
      lane,
      {
        presetId: String(source.presetId || DEFAULT_ARRANGER_PART_ASSIGNMENTS[lane].presetId),
        role: String(source.role || DEFAULT_ARRANGER_PART_ASSIGNMENTS[lane].role),
        midiChannel: Math.min(16, Math.max(1, Number(source.midiChannel || DEFAULT_ARRANGER_PART_ASSIGNMENTS[lane].midiChannel))),
      },
    ];
  }));
}

export function buildArrangerPlaybackContract(style, assignments = {}, sectionName = null) {
  const normalized = normalizeOpenStyle(style);
  const section = normalized.sections[sectionName || normalized.currentSection];
  const normalizedAssignments = normalizeArrangerAssignments(assignments);

  if (!section) {
    throw new Error("Unknown arranger section.");
  }

  return {
    schemaVersion: 1,
    tempo: normalized.tempo,
    timeSignature: normalized.timeSignature,
    section: section.id,
    bars: section.bars,
    parts: section.lanes.map((lane) => ({
      lane: lane.name,
      muted: lane.muted,
      volume: lane.volume,
      pan: lane.pan,
      assignment: normalizedAssignments[lane.name],
      events: lane.events.map((event) => ({
        beat: event.beat,
        duration: event.duration,
        note: event.note,
        velocity: event.velocity,
        role: event.role,
      })),
    })),
  };
}

export function routeArrangerEventToSampler(event, part, samplerByPreset = new Map()) {
  const presetId = part.assignment?.presetId;
  const sampler = samplerByPreset.get(presetId);

  if (!sampler) {
    return {
      ok: false,
      reason: "missing-preset",
      presetId,
      lane: part.lane,
    };
  }

  const result = sampler.noteOn(event.note, event.velocity);
  return {
    ok: result.ok,
    reason: result.reason || null,
    presetId,
    lane: part.lane,
    sampleId: result.sample?.id || null,
  };
}
