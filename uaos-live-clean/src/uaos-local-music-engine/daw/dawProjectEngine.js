export const UAOS_DAW_ENGINE_VERSION = "1.0.0-local-foundation";

export function createDawProject({
  title = "Untitled UAOS Project",
  tempo = 120,
  timeSignature = "4/4"
} = {}) {
  return {
    format: "UAOS_DAW_PROJECT",
    version: UAOS_DAW_ENGINE_VERSION,
    title,
    tempo,
    timeSignature,
    tracks: [],
    safety: {
      localJsonOnly: true,
      realKeyboardOutput: false,
      realKeyboardWriter: false,
      productionParser: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createTrack({
  trackId,
  name,
  type = "instrument",
  instrumentId = null
}) {
  return {
    trackId: trackId || `track-${Date.now()}`,
    name: name || "New Track",
    type,
    instrumentId,
    mute: false,
    solo: false,
    volume: 0.85,
    pan: 0,
    clips: []
  };
}

export function createMidiClip({
  clipId,
  startBeat = 0,
  lengthBeats = 4,
  notes = []
} = {}) {
  return {
    clipId: clipId || `midi-clip-${Date.now()}`,
    type: "midi",
    startBeat,
    lengthBeats,
    notes
  };
}

export function createAudioPlaceholderClip({
  clipId,
  startBeat = 0,
  lengthBeats = 4,
  label = "Audio Placeholder"
} = {}) {
  return {
    clipId: clipId || `audio-placeholder-${Date.now()}`,
    type: "audio-placeholder",
    startBeat,
    lengthBeats,
    label,
    audioFile: null,
    safety: "placeholder-only-no-large-audio"
  };
}

export function addTrack(project, track) {
  return {
    ...project,
    tracks: [...project.tracks, track],
    updatedAt: new Date().toISOString()
  };
}

export function addClipToTrack(project, trackId, clip) {
  return {
    ...project,
    tracks: project.tracks.map((track) => {
      if (track.trackId !== trackId) return track;
      return {
        ...track,
        clips: [...track.clips, clip]
      };
    }),
    updatedAt: new Date().toISOString()
  };
}

export function serializeProject(project) {
  if (!project || project.format !== "UAOS_DAW_PROJECT") {
    throw new Error("Invalid UAOS DAW project.");
  }
  return JSON.stringify(project, null, 2);
}

export function parseProjectJson(jsonText) {
  const project = JSON.parse(jsonText);
  if (project.format !== "UAOS_DAW_PROJECT") {
    throw new Error("Invalid UAOS DAW project JSON.");
  }
  return project;
}
