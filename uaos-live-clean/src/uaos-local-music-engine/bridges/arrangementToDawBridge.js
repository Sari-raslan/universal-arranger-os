export const UAOS_ARRANGEMENT_TO_DAW_BRIDGE_VERSION = "1.0.0-local-placeholder";

export function convertArrangementToDawProject(arrangement) {
  if (!arrangement || arrangement.format !== "UAOS_ARRANGEMENT_PROJECT") {
    throw new Error("Invalid arrangement project.");
  }

  const tracks = [
    createLaneTrack("drums", "Drums Placeholder", arrangement),
    createLaneTrack("bass", "Bass Placeholder", arrangement),
    createLaneTrack("chords", "Chords Placeholder", arrangement),
    createLaneTrack("pads", "Pads Placeholder", arrangement),
    createLaneTrack("melody", "Melody Guide Placeholder", arrangement)
  ];

  return {
    format: "UAOS_DAW_PROJECT",
    version: "1.0.0-local-bridge",
    title: `${arrangement.title} - DAW Bridge`,
    tempo: arrangement.tempo,
    timeSignature: arrangement.timeSignature,
    tracks,
    bridgeSafety: {
      localJsonOnly: true,
      noKeyboardFileWriter: true,
      noHardwareOutput: true,
      noProductionParser: true
    }
  };
}

function createLaneTrack(lane, name, arrangement) {
  const clips = [];

  for (const section of arrangement.sections || []) {
    clips.push({
      clipId: `${lane}-${section.sectionId || section.name}`,
      type: "midi-placeholder",
      sourceLane: lane,
      sectionName: section.name,
      startBar: section.startBar,
      bars: section.bars,
      chords: section.chords || [],
      events: section.styleLanes?.[lane] || []
    });
  }

  return {
    trackId: `track-${lane}`,
    name,
    type: lane === "drums" ? "drums-placeholder" : "instrument-placeholder",
    clips
  };
}
