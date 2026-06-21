export const UAOS_PHASE65_66_VERSION = "65-66.0.0";

export const DEVICE_SAFE_TRACK_CONFIGS = {
  korg: {
    target: "korg",
    futureFormats: [".STY", ".SET"],
    slots: ["INTRO_1", "INTRO_2", "VAR_1", "VAR_2", "VAR_3", "VAR_4", "FILL_1", "FILL_2", "ENDING_1"],
    blockers: [
      "KORG container structure not validated",
      "KORG style section binary rules not validated",
      "KORG checksum/package rules not validated",
      "KORG PA3X/PA5X editor or hardware validation missing"
    ]
  },
  roland: {
    target: "roland",
    futureFormats: [".STL", ".PRS"],
    slots: ["INTRO", "VARIATION_1", "VARIATION_2", "VARIATION_3", "VARIATION_4", "FILL", "ENDING"],
    blockers: [
      "Roland style/performance structure not validated",
      "Roland device-family compatibility not validated",
      "Roland package metadata rules not validated",
      "Roland BK/E-A editor or hardware validation missing"
    ]
  },
  ketron: {
    target: "ketron",
    futureFormats: [".PAT", ".MSP", ".KST"],
    slots: ["INTRO", "ARR_A", "ARR_B", "ARR_C", "ARR_D", "FILL", "BREAK", "ENDING"],
    blockers: [
      "Ketron package structure not validated",
      "Ketron audio drum reference rules not validated",
      "Ketron phrase/channel metadata not validated",
      "Ketron SD/Audya editor or hardware validation missing"
    ]
  }
};

export function createDeviceSafeTrack(target) {
  const config = DEVICE_SAFE_TRACK_CONFIGS[target];
  if (!config) throw new Error(`Unknown safe track target: ${target}`);

  const sections = config.slots.map((slot, index) => ({
    slot,
    sourceSectionId: `section_${index + 1}`,
    bars: slot.includes("FILL") || slot === "BREAK" ? 1 : 4,
    safeJsonReady: true,
    safeUaosbinReady: true,
    realBinaryChunkReady: false
  }));

  const tracks = [
    { id: "drums", channel: 10, role: "drums" },
    { id: "bass", channel: 2, role: "bass" },
    { id: "chords", channel: 3, role: "chords" },
    { id: "pad", channel: 4, role: "pad" },
    { id: "phrase", channel: 5, role: "phrase" }
  ].map((track) => ({
    ...track,
    safePhraseEventsReady: true,
    realBinarySerializationReady: false
  }));

  return {
    format: "UAOS_MULTI_DEVICE_SAFE_TRACK",
    version: UAOS_PHASE65_66_VERSION,
    target: config.target,
    futureFormats: config.futureFormats,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    allowSafeJsonPackage: true,
    allowSafeUaosbinPackage: true,
    allowRealBinaryOutput: false,
    sections,
    tracks,
    safePackage: {
      format: "UAOS_DEVICE_SAFE_PACKAGE",
      target: config.target,
      sections,
      tracks,
      realBinaryBlocked: true
    },
    qa: {
      status: "PASS",
      safeJsonReady: true,
      safeUaosbinReady: true,
      realBinaryReady: false,
      blockers: config.blockers
    },
    finalDecision: {
      canExportSafeJsonPackage: true,
      canExportSafeUaosbinPackage: true,
      canExportRealKeyboardBinary: false,
      reason: "Safe track prepared. Real keyboard binary output remains blocked until format validation, roundtrip import, checksum/package rules, and hardware/editor validation are complete."
    },
    safety: {
      realBinaryBlocked: true,
      warning: "Safe track only. No real proprietary keyboard binary is generated."
    }
  };
}

export function validateDeviceSafeTrack(track) {
  const errors = [];

  if (track?.format !== "UAOS_MULTI_DEVICE_SAFE_TRACK") errors.push("Invalid track format.");
  if (!track?.target) errors.push("Missing target.");
  if (!track?.futureFormats?.length) errors.push("Missing future formats.");
  if (track?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (track?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (track?.allowRealBinaryOutput !== false) errors.push("Real binary output must be blocked.");
  if (track?.finalDecision?.canExportRealKeyboardBinary !== false) errors.push("Final decision must block real binary.");
  if (track?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");
  if (!track?.sections?.length) errors.push("Missing sections.");
  if (!track?.tracks?.length) errors.push("Missing tracks.");
  if (!track?.qa?.blockers?.length) errors.push("Missing blockers.");

  return { ok: errors.length === 0, errors };
}

export function createAllDeviceSafeTracks() {
  return Object.keys(DEVICE_SAFE_TRACK_CONFIGS).map(createDeviceSafeTrack);
}
