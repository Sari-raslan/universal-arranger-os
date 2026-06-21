export const UAOS_PHASE37_VERSION = "37.0.0";

export const UAOS_DEVICE_PROFILES = {
  korg_pa3x_oriental: {
    brand: "KORG",
    model: "PA3X Oriental",
    family: "PA-Series",
    futureFormats: [".STY", ".SET"],
    currentExport: "UAOS JSON manifest",
    sections: ["intro1", "intro2", "mainA", "mainB", "mainC", "mainD", "fill1", "fill2", "ending1"],
    channels: { drums: 10, bass: 2, chords: 3, pad: 4, lead: 5 },
    realBinaryReady: false
  },
  korg_pa5x: {
    brand: "KORG",
    model: "PA5X",
    family: "PA-Series",
    futureFormats: [".STY", ".SET"],
    currentExport: "UAOS JSON manifest",
    sections: ["intro1", "intro2", "mainA", "mainB", "mainC", "mainD", "fill1", "fill2", "ending1"],
    channels: { drums: 10, bass: 2, chords: 3, pad: 4, lead: 5 },
    realBinaryReady: false
  },
  yamaha_genos: {
    brand: "Yamaha",
    model: "Genos",
    family: "Genos",
    futureFormats: [".STY"],
    currentExport: "UAOS JSON manifest",
    sections: ["intro1", "intro2", "mainA", "mainB", "mainC", "mainD", "fillA", "fillB", "ending1"],
    channels: { drums: 10, bass: 2, chords: 3, pad: 4, lead: 5 },
    realBinaryReady: false
  },
  roland_bk9: {
    brand: "Roland",
    model: "BK-9",
    family: "BK-Series",
    futureFormats: [".STL", ".PRS"],
    currentExport: "UAOS JSON manifest",
    sections: ["intro", "variation1", "variation2", "variation3", "variation4", "fill", "ending"],
    channels: { drums: 10, bass: 2, chords: 3, pad: 4, lead: 5 },
    realBinaryReady: false
  },
  ketron_sd9: {
    brand: "Ketron",
    model: "SD9",
    family: "SD-Series",
    futureFormats: [".PAT", ".MSP", ".KST"],
    currentExport: "UAOS JSON manifest",
    sections: ["intro", "arrA", "arrB", "arrC", "arrD", "fill", "break", "ending"],
    channels: { drums: 10, bass: 2, chords: 3, pad: 4, lead: 5 },
    realBinaryReady: false
  }
};

export function listUaosDeviceProfiles() {
  return Object.entries(UAOS_DEVICE_PROFILES).map(([id, profile]) => ({ id, ...profile }));
}

export function getUaosDeviceProfile(id) {
  const profile = UAOS_DEVICE_PROFILES[id];
  if (!profile) throw new Error(`Unknown UAOS device profile: ${id}`);
  return { id, ...profile };
}
