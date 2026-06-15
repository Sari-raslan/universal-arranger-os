const PROFILES = Object.freeze({
  "korg-pa3x": {
    vendor: "KORG",
    model: "PA3X",
    family: "arranger",
    midiPorts: 2,
    supportsStyleControl: true,
  },
  "korg-pa5x": {
    vendor: "KORG",
    model: "PA5X",
    family: "arranger",
    midiPorts: 2,
    supportsStyleControl: true,
  },
  "yamaha-genos": {
    vendor: "Yamaha",
    model: "Genos",
    family: "arranger",
    midiPorts: 2,
    supportsStyleControl: true,
  },
  "roland-bk9": {
    vendor: "Roland",
    model: "BK-9",
    family: "arranger",
    midiPorts: 2,
    supportsStyleControl: true,
  },
  "ketron-sd9": {
    vendor: "Ketron",
    model: "SD9",
    family: "arranger",
    midiPorts: 2,
    supportsStyleControl: true,
  },
});

export function listHardwareProfiles() {
  return Object.entries(PROFILES).map(([id, profile]) => ({ id, ...profile }));
}

export function getHardwareProfile(id) {
  const profile = PROFILES[id];
  if (!profile) {
    throw new Error(`Unknown hardware profile: ${id}`);
  }
  return { id, ...profile };
}

export function validateHardwareProfile(profile) {
  const required = ["vendor", "model", "family"];
  const missing = required.filter((key) => !profile?.[key]);

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true, missing: [] };
}