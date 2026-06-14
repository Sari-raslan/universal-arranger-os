export const MIDI_DEVICE_PROFILES = Object.freeze([
  {
    id: "korg-pa3x-oriental",
    name: "KORG PA3X Oriental",
    match: ["korg", "pa3x"],
    family: "arranger",
    support: "generic-midi",
    notes: "Generic note, velocity, sustain, clock monitoring, and panic. Proprietary style parsing is not enabled.",
  },
  {
    id: "korg-pa5x",
    name: "KORG PA5X",
    match: ["korg", "pa5x"],
    family: "arranger",
    support: "generic-midi",
    notes: "Generic MIDI foundation only. Device-specific SysEx remains disabled.",
  },
  {
    id: "yamaha-genos",
    name: "Yamaha Genos",
    match: ["yamaha", "genos"],
    family: "arranger",
    support: "generic-midi",
    notes: "Generic MIDI foundation only. Yamaha proprietary style parsing is not claimed.",
  },
  {
    id: "roland-bk9",
    name: "Roland BK-9",
    match: ["roland", "bk-9", "bk9"],
    family: "arranger",
    support: "generic-midi",
    notes: "Generic notes, controls, sustain, and panic.",
  },
  {
    id: "ketron-sd9",
    name: "Ketron SD9",
    match: ["ketron", "sd9"],
    family: "arranger",
    support: "generic-midi",
    notes: "Generic MIDI foundation only.",
  },
  {
    id: "ni-kontrol-s88-mk3",
    name: "Native Instruments Kontrol S88 MK3",
    match: ["native instruments", "kontrol s88", "s88 mk3"],
    family: "controller",
    support: "generic-midi",
    notes: "Keys, velocity, sustain, pressure monitoring, and generic controls.",
  },
]);

const GENERIC_PROFILE = Object.freeze({
  id: "generic-midi-device",
  name: "Generic MIDI Device",
  family: "generic",
  support: "generic-midi",
  notes: "Standard channel messages only. SysEx is disabled.",
});

export function detectMidiDeviceProfile(name = "", manufacturer = "") {
  const haystack = `${manufacturer} ${name}`.trim().toLowerCase();

  if (!haystack) {
    return GENERIC_PROFILE;
  }

  const scored = MIDI_DEVICE_PROFILES.map((profile) => ({
    profile,
    score: profile.match.reduce(
      (total, token) => total + (haystack.includes(token) ? 1 : 0),
      0,
    ),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.profile || GENERIC_PROFILE;
}