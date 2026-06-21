export const UAOS_PIANO_ROLL_MODEL_VERSION = "1.0.0-local-placeholder";

export function createPianoRollClip({
  clipId = `piano-roll-${Date.now()}`,
  startBeat = 0,
  lengthBeats = 4,
  notes = []
} = {}) {
  return {
    format: "UAOS_PIANO_ROLL_CLIP",
    version: UAOS_PIANO_ROLL_MODEL_VERSION,
    clipId,
    startBeat,
    lengthBeats,
    notes,
    safety: {
      localModelOnly: true,
      noHardwareOutput: true,
      noKeyboardFileWriter: true
    }
  };
}

export function addNote(clip, {
  note = 60,
  startBeat = 0,
  durationBeats = 1,
  velocity = 100,
  channel = 1
} = {}) {
  return {
    ...clip,
    notes: [
      ...clip.notes,
      {
        note,
        startBeat,
        durationBeats,
        velocity,
        channel
      }
    ]
  };
}

export function quantizeNotes(clip, grid = 0.25) {
  return {
    ...clip,
    notes: clip.notes.map((n) => ({
      ...n,
      startBeat: Math.round(n.startBeat / grid) * grid,
      durationBeats: Math.max(grid, Math.round(n.durationBeats / grid) * grid)
    }))
  };
}

export function transposeNotes(clip, semitones = 0) {
  return {
    ...clip,
    notes: clip.notes.map((n) => ({
      ...n,
      note: Math.max(0, Math.min(127, n.note + semitones))
    }))
  };
}
