export const UAOS_PHASE56_VERSION = "56.0.0";

export function createYamahaStyWriterResearchPlan(input = {}) {
  const sourceSections = input.sections || [
    { id: "intro1", yamahaSlot: "INTRO_A", bars: 4, chord: "Dm" },
    { id: "mainA", yamahaSlot: "MAIN_A", bars: 8, chord: "Dm" },
    { id: "fillA", yamahaSlot: "FILL_A", bars: 1, chord: "A7" },
    { id: "mainB", yamahaSlot: "MAIN_B", bars: 8, chord: "Gm" },
    { id: "ending1", yamahaSlot: "ENDING_A", bars: 4, chord: "Dm" }
  ];

  const tracks = input.tracks || [
    { id: "rhythm1", role: "drums", channel: 10 },
    { id: "rhythm2", role: "percussion", channel: 9 },
    { id: "bass", role: "bass", channel: 11 },
    { id: "chord1", role: "chords", channel: 12 },
    { id: "chord2", role: "pad", channel: 13 },
    { id: "phrase1", role: "phrase", channel: 14 },
    { id: "phrase2", role: "phrase", channel: 15 }
  ];

  return {
    format: "UAOS_YAMAHA_STY_WRITER_RESEARCH_PLAN",
    version: UAOS_PHASE56_VERSION,
    phase: 56,
    target: "yamaha",
    futureFormat: ".STY",
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    allowedOutputsNow: [".json", ".uaosbin"],
    blockedOutputs: [".STY"],
    sourceSections,
    tracks,
    researchModel: {
      sections: sourceSections.map((section) => ({
        sourceId: section.id,
        yamahaSlot: section.yamahaSlot,
        bars: section.bars,
        chord: section.chord,
        midiPhraseReady: true,
        binaryChunkReady: false
      })),
      trackPolicy: tracks.map((track) => ({
        trackId: track.id,
        role: track.role,
        midiChannel: track.channel,
        styChannelMappingReady: false
      })),
      requiredBeforeWriter: [
        "confirmed Yamaha style chunk/container structure",
        "confirmed section phrase serialization rules",
        "confirmed CASM-like rules",
        "confirmed OTS metadata rules",
        "checksum/package validation",
        "roundtrip import in safe editor",
        "hardware/device validation"
      ]
    },
    safety: {
      status: "RESEARCH_TRACK_READY",
      warning: "Phase 56 prepares Yamaha STY writer research only. It does not create a real .STY file."
    }
  };
}

export function validateYamahaStyWriterResearchPlan(plan) {
  const errors = [];

  if (plan?.format !== "UAOS_YAMAHA_STY_WRITER_RESEARCH_PLAN") errors.push("Invalid plan format.");
  if (plan?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (plan?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (plan?.realStyWriterReady !== false) errors.push("Must not claim real STY writer ready.");
  if (plan?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (!plan?.sourceSections?.length) errors.push("Missing source sections.");
  if (!plan?.tracks?.length) errors.push("Missing tracks.");
  if (!plan?.researchModel?.requiredBeforeWriter?.length) errors.push("Missing writer requirements.");

  return { ok: errors.length === 0, errors };
}
