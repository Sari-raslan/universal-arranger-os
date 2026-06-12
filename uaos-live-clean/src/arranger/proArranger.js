export const V2_SECTIONS = [
  "INTRO_1", "INTRO_2", "INTRO_3",
  "VARIATION_A", "VARIATION_B", "VARIATION_C", "VARIATION_D",
  "FILL_1", "FILL_2", "FILL_3", "FILL_4",
  "BREAK", "ENDING_1", "ENDING_2", "ENDING_3", "COUNT_IN"
];

export const V2_LANES = ["drums", "percussion", "bass", "chord1", "chord2", "pad", "phrase1", "phrase2", "lead"];

export function createLane(name, index) {
  return {
    id: name,
    enabled: true,
    mute: false,
    solo: false,
    channel: name === "drums" || name === "percussion" ? 10 : index + 1,
    outputDevice: "",
    program: 0,
    bank: 0,
    volume: 100,
    pan: 64,
    velocity: 100,
    transpose: 0,
    octave: 0,
    humanize: 0,
    quantize: 120,
    noteRange: [0, 127],
    patternId: `${name}-basic`
  };
}

export function createProArrangerState() {
  return {
    section: "VARIATION_A",
    pendingSection: null,
    transitionBoundary: "bar",
    lanes: Object.fromEntries(V2_LANES.map((lane, index) => [lane, createLane(lane, index)])),
    chordMode: "fingered",
    chordHold: false,
    memoryMode: false,
    splitPoint: 60,
    scenes: [],
    liveMacros: {}
  };
}

export function reduceProArranger(state, action) {
  const current = state || createProArrangerState();
  if (action.type === "requestSection") {
    return V2_SECTIONS.includes(action.section) ? { ...current, pendingSection: action.section, transitionBoundary: action.boundary || "bar" } : current;
  }
  if (action.type === "commitBoundary") {
    return current.pendingSection && action.boundary === current.transitionBoundary
      ? { ...current, section: current.pendingSection, pendingSection: null }
      : current;
  }
  if (action.type === "lane") {
    const lane = current.lanes[action.lane];
    if (!lane) return current;
    return { ...current, lanes: { ...current.lanes, [action.lane]: { ...lane, ...action.patch } } };
  }
  if (action.type === "saveScene") {
    return { ...current, scenes: [...current.scenes, { name: action.name || `Scene ${current.scenes.length + 1}`, section: current.section, lanes: current.lanes, chordMode: current.chordMode, splitPoint: current.splitPoint }] };
  }
  if (action.type === "recallScene") {
    const scene = current.scenes[action.index];
    return scene ? { ...current, section: scene.section, lanes: scene.lanes, chordMode: scene.chordMode, splitPoint: scene.splitPoint } : current;
  }
  if (action.type === "chordMode") return { ...current, chordMode: action.mode || current.chordMode };
  if (action.type === "split") return { ...current, splitPoint: Math.max(0, Math.min(127, Number(action.note) || current.splitPoint)) };
  return current;
}

export function activeLanes(state) {
  const lanes = Object.values((state || createProArrangerState()).lanes);
  const soloed = lanes.filter((lane) => lane.solo);
  return (soloed.length ? soloed : lanes).filter((lane) => lane.enabled && !lane.mute);
}

