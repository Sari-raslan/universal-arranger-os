let fallbackIdCounter = 0;

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return prefix + "-" + globalThis.crypto.randomUUID();
  }

  fallbackIdCounter += 1;
  return prefix + "-" + Date.now().toString(36) + "-" + fallbackIdCounter.toString(36);
}

export function createTrack(options = {}) {
  return {
    id: options.id ?? createId("track"),
    name: options.name ?? "New Track",
    type: options.type ?? "audio",
    muted: false,
    solo: false,
    armed: false,
    volume: 1,
    pan: 0,
    clips: [],
  };
}

export function createClip(options = {}) {
  const startBeats = Math.max(0, Number(options.startBeats ?? 0));
  const durationBeats = Math.max(0.01, Number(options.durationBeats ?? 4));

  return {
    id: options.id ?? createId("clip"),
    name: options.name ?? "New Clip",
    type: options.type ?? "audio",
    startBeats,
    durationBeats,
    source: options.source ?? null,
    offsetBeats: Math.max(0, Number(options.offsetBeats ?? 0)),
    gain: Number(options.gain ?? 1),
    muted: Boolean(options.muted),
  };
}

export function addClipToTrack(track, clip) {
  if (!track || !clip) {
    throw new TypeError("Track and clip are required.");
  }

  return {
    ...track,
    clips: [...(track.clips ?? []), clip].sort(
      (a, b) => a.startBeats - b.startBeats,
    ),
  };
}

export function removeClipFromTrack(track, clipId) {
  return {
    ...track,
    clips: (track.clips ?? []).filter((clip) => clip.id !== clipId),
  };
}
