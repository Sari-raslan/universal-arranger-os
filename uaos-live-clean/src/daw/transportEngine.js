const VALID_STATES = new Set([
  "stopped",
  "playing",
  "paused",
  "recording",
]);

export function createTransport(options = {}) {
  const tempo = Number(options.tempo ?? 120);

  if (!Number.isFinite(tempo) || tempo < 20 || tempo > 400) {
    throw new RangeError("Tempo must be between 20 and 400 BPM.");
  }

  return {
    state: "stopped",
    tempo,
    timeSignature: options.timeSignature ?? "4/4",
    positionBeats: 0,
    loopEnabled: false,
    loopStartBeats: 0,
    loopEndBeats: 16,
    updatedAt: new Date().toISOString(),
  };
}

export function updateTransport(transport, patch = {}) {
  if (!transport || typeof transport !== "object") {
    throw new TypeError("A transport object is required.");
  }

  const state = patch.state ?? transport.state;

  if (!VALID_STATES.has(state)) {
    throw new Error("Invalid transport state: " + state);
  }

  const tempo = Number(patch.tempo ?? transport.tempo);

  if (!Number.isFinite(tempo) || tempo < 20 || tempo > 400) {
    throw new RangeError("Tempo must be between 20 and 400 BPM.");
  }

  const positionBeats = Math.max(
    0,
    Number(patch.positionBeats ?? transport.positionBeats),
  );

  return {
    ...transport,
    ...patch,
    state,
    tempo,
    positionBeats,
    updatedAt: new Date().toISOString(),
  };
}

export function beatsToSeconds(beats, tempo) {
  const safeBeats = Number(beats);
  const safeTempo = Number(tempo);

  if (!Number.isFinite(safeBeats) || !Number.isFinite(safeTempo) || safeTempo <= 0) {
    throw new TypeError("Valid beats and tempo are required.");
  }

  return safeBeats * (60 / safeTempo);
}

export function secondsToBeats(seconds, tempo) {
  const safeSeconds = Number(seconds);
  const safeTempo = Number(tempo);

  if (!Number.isFinite(safeSeconds) || !Number.isFinite(safeTempo) || safeTempo <= 0) {
    throw new TypeError("Valid seconds and tempo are required.");
  }

  return safeSeconds / (60 / safeTempo);
}
