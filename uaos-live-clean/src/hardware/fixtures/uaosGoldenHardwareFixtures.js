export const UAOS_PHASE39_VERSION = "39.0.0";

export const UAOS_GOLDEN_HARDWARE_FIXTURES = [
  {
    id: "oriental-pop-cminor-096",
    name: "Oriental Pop C Minor 96 BPM",
    tempo: 96,
    meter: "4/4",
    key: "C minor",
    chordProgression: ["Cm", "Ab", "Fm", "G7"],
    sections: [
      { id: "intro1", type: "intro", bars: 4, chord: "Cm" },
      { id: "mainA", type: "main", bars: 8, chord: "Cm" },
      { id: "fill1", type: "fill", bars: 1, chord: "G7" },
      { id: "mainB", type: "main", bars: 8, chord: "Fm" },
      { id: "ending1", type: "ending", bars: 4, chord: "Cm" }
    ],
    tracks: [
      { id: "drums", role: "drums", channel: 10, program: "standard-kit" },
      { id: "bass", role: "bass", channel: 2, program: "finger-bass" },
      { id: "chords", role: "chords", channel: 3, program: "warm-keys" },
      { id: "pad", role: "pad", channel: 4, program: "strings-pad" },
      { id: "lead", role: "lead", channel: 5, program: "oriental-violin" }
    ]
  },
  {
    id: "khaleeji-dminor-104",
    name: "Khaleeji D Minor 104 BPM",
    tempo: 104,
    meter: "4/4",
    key: "D minor",
    chordProgression: ["Dm", "Bb", "Gm", "A7"],
    sections: [
      { id: "intro1", type: "intro", bars: 4, chord: "Dm" },
      { id: "mainA", type: "main", bars: 8, chord: "Dm" },
      { id: "fill1", type: "fill", bars: 1, chord: "A7" },
      { id: "mainB", type: "main", bars: 8, chord: "Gm" },
      { id: "ending1", type: "ending", bars: 4, chord: "Dm" }
    ],
    tracks: [
      { id: "drums", role: "drums", channel: 10, program: "arabic-kit" },
      { id: "bass", role: "bass", channel: 2, program: "picked-bass" },
      { id: "chords", role: "chords", channel: 3, program: "oud-comp" },
      { id: "pad", role: "pad", channel: 4, program: "warm-strings" },
      { id: "lead", role: "lead", channel: 5, program: "oriental-violin" }
    ]
  }
];

export function listGoldenHardwareFixtures() {
  return UAOS_GOLDEN_HARDWARE_FIXTURES;
}

export function getGoldenHardwareFixture(id) {
  const fixture = UAOS_GOLDEN_HARDWARE_FIXTURES.find(x => x.id === id);
  if (!fixture) throw new Error(`Unknown golden fixture: ${id}`);
  return fixture;
}

export function validateGoldenHardwareFixture(fixture) {
  const errors = [];
  if (!fixture?.id) errors.push("Missing fixture id.");
  if (!fixture?.tempo) errors.push("Missing tempo.");
  if (!fixture?.sections?.length) errors.push("Missing sections.");
  if (!fixture?.tracks?.length) errors.push("Missing tracks.");
  if (!fixture?.chordProgression?.length) errors.push("Missing chord progression.");
  return { ok: errors.length === 0, errors };
}
