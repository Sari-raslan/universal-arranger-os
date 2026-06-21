export const UAOS_PHASE57_VERSION = "57.0.0";

export function createYamahaStyIntermediateSchema(input = {}) {
  const styleName = input.styleName || "UAOS Yamaha Research Style";
  const tempo = input.tempo || 96;
  const timeSignature = input.timeSignature || "4/4";

  const sections = input.sections || [
    { id: "introA", slot: "INTRO_A", bars: 4, chordRoot: "D", chordType: "minor" },
    { id: "mainA", slot: "MAIN_A", bars: 8, chordRoot: "D", chordType: "minor" },
    { id: "fillA", slot: "FILL_A", bars: 1, chordRoot: "A", chordType: "7" },
    { id: "mainB", slot: "MAIN_B", bars: 8, chordRoot: "G", chordType: "minor" },
    { id: "endingA", slot: "ENDING_A", bars: 4, chordRoot: "D", chordType: "minor" }
  ];

  const tracks = input.tracks || [
    { id: "rhythm1", role: "drums", channel: 10, phraseType: "drum-pattern" },
    { id: "rhythm2", role: "percussion", channel: 9, phraseType: "percussion-pattern" },
    { id: "bass", role: "bass", channel: 11, phraseType: "bass-line" },
    { id: "chord1", role: "chords", channel: 12, phraseType: "chord-comp" },
    { id: "chord2", role: "pad", channel: 13, phraseType: "pad-comp" },
    { id: "phrase1", role: "phrase", channel: 14, phraseType: "phrase-line" },
    { id: "phrase2", role: "phrase", channel: 15, phraseType: "phrase-line" }
  ];

  return {
    format: "UAOS_YAMAHA_STY_INTERMEDIATE_SCHEMA",
    version: UAOS_PHASE57_VERSION,
    phase: 57,
    target: "yamaha",
    futureFormat: ".STY",
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    allowedOutputsNow: [".json", ".uaosbin"],
    blockedOutputs: [".STY"],
    metadata: {
      styleName,
      tempo,
      timeSignature,
      source: "UAOS safe intermediate schema",
      warning: "This is not a real Yamaha STY binary file."
    },
    sections: sections.map((section) => ({
      ...section,
      binaryChunkReady: false,
      midiPhraseContainerReady: true,
      tracks: tracks.map((track) => ({
        trackId: track.id,
        role: track.role,
        midiChannel: track.channel,
        phraseType: track.phraseType,
        phraseEvents: [],
        binarySerializationReady: false
      }))
    })),
    ots: {
      enabled: false,
      presets: [],
      binaryMetadataReady: false
    },
    casmLikeRules: {
      researched: false,
      rules: [],
      binaryRulesReady: false
    },
    safety: {
      status: "INTERMEDIATE_SCHEMA_READY",
      realBinaryBlocked: true,
      warning: "Phase 57 produces only safe JSON intermediate schema."
    }
  };
}

export function validateYamahaStyIntermediateSchema(schema) {
  const errors = [];

  if (schema?.format !== "UAOS_YAMAHA_STY_INTERMEDIATE_SCHEMA") errors.push("Invalid schema format.");
  if (schema?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (schema?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (schema?.realStyWriterReady !== false) errors.push("Must not claim real STY writer ready.");
  if (schema?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (!schema?.sections?.length) errors.push("Missing sections.");
  if (!schema?.sections?.every(s => s.binaryChunkReady === false)) errors.push("Every section must keep binaryChunkReady false.");
  if (schema?.safety?.realBinaryBlocked !== true) errors.push("Safety realBinaryBlocked must be true.");

  return { ok: errors.length === 0, errors };
}
