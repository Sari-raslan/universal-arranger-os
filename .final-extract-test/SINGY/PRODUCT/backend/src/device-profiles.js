export const profiles = {
  "Generic MIDI": { channels:{ drums:10, bass:2, chord:3, lead:4 }, clock:true },
  "KORG PA3X": { channels:{ drums:10, bass:9, chord:1, lead:4 }, clock:true, styleFormat:"SET" },
  "KORG PA5X": { channels:{ drums:10, bass:9, chord:1, lead:4 }, clock:true, styleFormat:"KST" },
  "Yamaha Genos": { channels:{ drums:10, bass:2, chord:3, lead:1 }, clock:true, styleFormat:"STY" },
  "Roland BK9": { channels:{ drums:10, bass:2, chord:3, lead:4 }, clock:true, styleFormat:"STL" },
  "Ketron SD9": { channels:{ drums:10, bass:2, chord:3, lead:4 }, clock:true, styleFormat:"PAT" }
};

export function listProfiles(){ return profiles; }
export function getProfile(name){ return profiles[name] || profiles["Generic MIDI"]; }