export const DEVICE_PROFILES = [
  { id: "generic-midi-controller", name: "Generic MIDI Controller", verified: true, capabilities: ["notes", "cc", "program", "pitchbend"] },
  { id: "generic-foot-controller", name: "Generic Foot Controller", verified: false, capabilities: ["cc", "program"], unsupported: ["proprietary-style-import"] },
  { id: "korg-pa-template", name: "KORG PA Mapping Template", verified: false, capabilities: ["notes", "cc"], unsupported: ["proprietary-style-import"] },
  { id: "yamaha-genos-template", name: "Yamaha Genos Mapping Template", verified: false, capabilities: ["notes", "cc"], unsupported: ["proprietary-style-import"] },
  { id: "roland-arranger-template", name: "Roland Arranger Mapping Template", verified: false, capabilities: ["notes", "cc"], unsupported: ["proprietary-style-import"] },
  { id: "ketron-arranger-template", name: "Ketron Arranger Mapping Template", verified: false, capabilities: ["notes", "cc"], unsupported: ["proprietary-style-import"] }
];

export function validateDeviceProfile(profile) {
  if (!profile?.id || !profile?.name) return { ok: false, error: "Profile requires id and name." };
  if (!Array.isArray(profile.capabilities)) return { ok: false, error: "Profile capabilities must be an array." };
  return { ok: true };
}

export function exportProfile(profile) {
  const validation = validateDeviceProfile(profile);
  if (!validation.ok) throw new Error(validation.error);
  return JSON.stringify({ version: 2, ...profile }, null, 2);
}

export function importProfile(text) {
  const profile = JSON.parse(text);
  const validation = validateDeviceProfile(profile);
  if (!validation.ok) throw new Error(validation.error);
  return profile;
}

