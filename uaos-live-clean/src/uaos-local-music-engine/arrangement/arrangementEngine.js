export const UAOS_ARRANGEMENT_ENGINE_VERSION = "1.0.0-local-foundation";

export function createArrangement({
  title = "Untitled Arrangement",
  tempo = 120,
  timeSignature = "4/4",
  key = "C"
} = {}) {
  return {
    format: "UAOS_ARRANGEMENT_PROJECT",
    version: UAOS_ARRANGEMENT_ENGINE_VERSION,
    title,
    tempo,
    timeSignature,
    key,
    sections: [],
    safety: {
      exportTarget: "UAOS project JSON only",
      realKeyboardOutput: false,
      realKeyboardWriter: false,
      productionParser: false
    }
  };
}

export function createSongSection({
  sectionId,
  name = "Verse",
  startBar = 1,
  bars = 8,
  chords = ["C", "Am", "F", "G"]
} = {}) {
  return {
    sectionId: sectionId || `section-${Date.now()}`,
    name,
    startBar,
    bars,
    chords,
    styleLanes: {
      drums: [],
      bass: [],
      chords: [],
      pads: [],
      melody: []
    }
  };
}

export function generatePlaceholderStyleLanes(section) {
  const bars = section.bars || 4;
  const chords = section.chords || ["C"];

  return {
    ...section,
    styleLanes: {
      drums: Array.from({ length: bars }, (_, i) => ({
        bar: section.startBar + i,
        pattern: "placeholder-drum-groove"
      })),
      bass: Array.from({ length: bars }, (_, i) => ({
        bar: section.startBar + i,
        chord: chords[i % chords.length],
        pattern: "placeholder-root-fifth"
      })),
      chords: Array.from({ length: bars }, (_, i) => ({
        bar: section.startBar + i,
        chord: chords[i % chords.length],
        pattern: "placeholder-comping"
      })),
      pads: Array.from({ length: bars }, (_, i) => ({
        bar: section.startBar + i,
        chord: chords[i % chords.length],
        pattern: "placeholder-long-pad"
      })),
      melody: Array.from({ length: bars }, (_, i) => ({
        bar: section.startBar + i,
        guide: "placeholder-melody-guide"
      }))
    }
  };
}

export function addSection(arrangement, section) {
  return {
    ...arrangement,
    sections: [...arrangement.sections, section]
  };
}

export function exportArrangementToUaosProjectJson(arrangement) {
  if (!arrangement || arrangement.format !== "UAOS_ARRANGEMENT_PROJECT") {
    throw new Error("Invalid UAOS arrangement.");
  }

  return {
    format: "UAOS_PROJECT_JSON",
    version: "1.0.0-local-arrangement-export",
    source: "UAOS_ARRANGEMENT_ENGINE",
    title: arrangement.title,
    tempo: arrangement.tempo,
    timeSignature: arrangement.timeSignature,
    key: arrangement.key,
    arrangement,
    exportSafety: {
      jsonOnly: true,
      noRealKeyboardWriter: true,
      noRealKeyboardOutput: true,
      noProductionParser: true
    }
  };
}
