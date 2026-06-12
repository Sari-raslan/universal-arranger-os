export const SECTIONS = ["INTRO", "VAR_A", "VAR_B", "VAR_C", "VAR_D", "FILL_1", "FILL_2", "BREAK", "ENDING"];
export const LANES = ["drum", "bass", "chord", "pad", "lead"];

export function createArrangerState() {
  return {
    running: false,
    bpm: 96,
    section: "INTRO",
    chord: "Cm",
    bar: 1,
    beat: 1,
    muted: {},
    solo: {},
    channels: { drum: 10, bass: 2, chord: 3, pad: 4, lead: 1 },
    patterns: Object.fromEntries(LANES.map((lane) => [lane, "basic"])),
    sectionMemory: {},
    scenes: [],
    setlist: []
  };
}

export function reduceArranger(state, action) {
  const current = state || createArrangerState();
  switch (action.type) {
    case "start":
      return { ...current, running: true };
    case "stop":
      return { ...current, running: false, bar: 1, beat: 1 };
    case "tick": {
      const beat = current.beat >= 4 ? 1 : current.beat + 1;
      const bar = current.beat >= 4 ? current.bar + 1 : current.bar;
      return { ...current, beat, bar };
    }
    case "section":
      return SECTIONS.includes(action.section) ? { ...current, section: action.section, sectionMemory: { ...current.sectionMemory, [action.section]: current.patterns } } : current;
    case "bpm":
      return { ...current, bpm: Math.max(30, Math.min(260, Number(action.bpm) || current.bpm)) };
    case "chord":
      return { ...current, chord: String(action.chord || current.chord) };
    case "mute":
      return { ...current, muted: { ...current.muted, [action.lane]: !current.muted[action.lane] } };
    case "solo":
      return { ...current, solo: { ...current.solo, [action.lane]: !current.solo[action.lane] } };
    case "pattern":
      return { ...current, patterns: { ...current.patterns, [action.lane]: action.pattern || "basic" } };
    case "saveScene":
      return { ...current, scenes: [...current.scenes, { name: action.name || `Scene ${current.scenes.length + 1}`, section: current.section, chord: current.chord, patterns: current.patterns }] };
    case "recallScene": {
      const scene = current.scenes[action.index];
      return scene ? { ...current, section: scene.section, chord: scene.chord, patterns: scene.patterns } : current;
    }
    default:
      return current;
  }
}

export function nextTickMs(bpm) {
  return (60_000 / Math.max(30, Math.min(260, Number(bpm) || 120)));
}

