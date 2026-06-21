export const UAOS_PHASE54_VERSION = "54.0.0";

const DEFAULT_TRACKS = [
  { id: "drums", role: "drums", channel: 10 },
  { id: "bass", role: "bass", channel: 2 },
  { id: "chords", role: "chords", channel: 3 },
  { id: "pad", role: "pad", channel: 4 },
  { id: "lead", role: "lead", channel: 5 }
];

export const UAOS_SECTION_BINARY_TARGET_MAPS = {
  korg: {
    target: "korg",
    futureFormats: [".STY", ".SET"],
    sectionSlots: ["INTRO_1", "INTRO_2", "VAR_1", "VAR_2", "VAR_3", "VAR_4", "FILL_1", "FILL_2", "ENDING_1"],
    channelPolicy: "arranger-style-channel-map"
  },
  yamaha: {
    target: "yamaha",
    futureFormats: [".STY"],
    sectionSlots: ["INTRO_A", "INTRO_B", "INTRO_C", "MAIN_A", "MAIN_B", "MAIN_C", "MAIN_D", "FILL_A", "FILL_B", "ENDING_A", "ENDING_B", "ENDING_C"],
    channelPolicy: "style-section-midi-map"
  },
  roland: {
    target: "roland",
    futureFormats: [".STL", ".PRS"],
    sectionSlots: ["INTRO", "VARIATION_1", "VARIATION_2", "VARIATION_3", "VARIATION_4", "FILL", "ENDING"],
    channelPolicy: "performance-style-map"
  },
  ketron: {
    target: "ketron",
    futureFormats: [".PAT", ".MSP", ".KST"],
    sectionSlots: ["INTRO", "ARR_A", "ARR_B", "ARR_C", "ARR_D", "FILL", "BREAK", "ENDING"],
    channelPolicy: "style-audio-drum-reference-map"
  }
};

export function createSectionBinaryMappingPlan(target, input = {}) {
  const targetMap = UAOS_SECTION_BINARY_TARGET_MAPS[target];
  if (!targetMap) throw new Error(`Unknown target for section binary mapping: ${target}`);

  const sourceSections = input.sections || [
    { id: "intro1", type: "intro", bars: 4, chord: "Cm" },
    { id: "mainA", type: "main", bars: 8, chord: "Cm" },
    { id: "fill1", type: "fill", bars: 1, chord: "G7" },
    { id: "mainB", type: "main", bars: 8, chord: "Fm" },
    { id: "ending1", type: "ending", bars: 4, chord: "Cm" }
  ];

  const tracks = input.tracks || DEFAULT_TRACKS;

  return {
    format: "UAOS_SECTION_TO_BINARY_MAPPING_PLAN",
    version: UAOS_PHASE54_VERSION,
    target,
    futureFormats: targetMap.futureFormats,
    realBinaryWriterReady: false,
    binaryOutputBlocked: true,
    source: {
      sections: sourceSections,
      tracks
    },
    mapping: {
      sectionSlots: targetMap.sectionSlots.map((slot, index) => ({
        slot,
        sourceSection: sourceSections[index % sourceSections.length],
        safeIntermediateOnly: true
      })),
      trackChannels: tracks.map((track) => ({
        trackId: track.id,
        role: track.role,
        channel: track.channel,
        binaryChannelReady: false,
        policy: targetMap.channelPolicy
      }))
    },
    safety: {
      warning: "Phase 54 creates mapping plans only. It does not write proprietary keyboard binary files.",
      allowedNow: [".json", ".uaosbin"],
      blockedUntilValidated: targetMap.futureFormats
    }
  };
}

export function validateSectionBinaryMappingPlan(plan) {
  const errors = [];
  if (plan?.format !== "UAOS_SECTION_TO_BINARY_MAPPING_PLAN") errors.push("Invalid mapping plan format.");
  if (!plan?.target) errors.push("Missing target.");
  if (plan?.realBinaryWriterReady !== false) errors.push("Must not claim real binary writer ready.");
  if (plan?.binaryOutputBlocked !== true) errors.push("Binary output must remain blocked.");
  if (!plan?.mapping?.sectionSlots?.length) errors.push("Missing section slot mappings.");
  if (!plan?.mapping?.trackChannels?.length) errors.push("Missing track channel mappings.");
  return { ok: errors.length === 0, errors };
}

export function createAllSectionBinaryMappingPlans(input = {}) {
  return Object.keys(UAOS_SECTION_BINARY_TARGET_MAPS).map((target) =>
    createSectionBinaryMappingPlan(target, input)
  );
}
