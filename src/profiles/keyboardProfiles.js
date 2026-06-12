export const DEFAULT_KEYBOARD_PROFILES = {
  GENERAL_MIDI: {
    name: "General MIDI",
    channel: 1,
    transpose: 0,
    controls: { start:[0xFA], stop:[0xFC], continue:[0xFB] },
    sections: { INTRO:null, VAR_A:null, VAR_B:null, FILL:null, BREAK:null, ENDING:null }
  },
  KORG_PA: {
    name: "KORG PA Series Draft",
    channel: 1,
    transpose: 0,
    controls: { start:[0xFA], stop:[0xFC], continue:[0xFB] },
    sections: { INTRO:[0xC0,80], VAR_A:[0xC0,81], VAR_B:[0xC0,82], FILL:[0xC0,83], BREAK:[0xC0,84], ENDING:[0xC0,85] }
  },
  YAMAHA_GENOS: {
    name: "Yamaha Genos Draft",
    channel: 1,
    transpose: 0,
    controls: { start:[0xFA], stop:[0xFC], continue:[0xFB] },
    sections: { INTRO:[0xC0,70], VAR_A:[0xC0,71], VAR_B:[0xC0,72], FILL:[0xC0,73], BREAK:[0xC0,74], ENDING:[0xC0,75] }
  },
  KETRON_SD: {
    name: "Ketron SD Draft",
    channel: 1,
    transpose: 0,
    controls: { start:[0xFA], stop:[0xFC], continue:[0xFB] },
    sections: { INTRO:[0xC0,60], VAR_A:[0xC0,61], VAR_B:[0xC0,62], FILL:[0xC0,63], BREAK:[0xC0,64], ENDING:[0xC0,65] }
  }
};

export function loadKeyboardProfiles(){
  return JSON.parse(localStorage.getItem("uaos.v113.keyboardProfiles") || "null") || DEFAULT_KEYBOARD_PROFILES;
}

export function saveKeyboardProfiles(profiles){
  localStorage.setItem("uaos.v113.keyboardProfiles", JSON.stringify(profiles));
}
