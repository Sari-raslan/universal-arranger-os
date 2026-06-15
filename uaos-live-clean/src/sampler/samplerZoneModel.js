export function createSamplerZone(options = {}) {
  const rootKey = Number(options.rootKey ?? 60);
  const lowKey = Number(options.lowKey ?? rootKey);
  const highKey = Number(options.highKey ?? rootKey);
  const lowVelocity = Number(options.lowVelocity ?? 1);
  const highVelocity = Number(options.highVelocity ?? 127);

  const values = [rootKey, lowKey, highKey, lowVelocity, highVelocity];

  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 127)) {
    throw new RangeError("Sampler MIDI values must be integers from 0 to 127.");
  }

  if (lowKey > highKey) {
    throw new RangeError("lowKey cannot be greater than highKey.");
  }

  if (lowVelocity > highVelocity) {
    throw new RangeError("lowVelocity cannot be greater than highVelocity.");
  }

  return {
    id: options.id ?? globalThis.crypto?.randomUUID?.() ?? ("zone-" + Date.now()),
    name: options.name ?? "Sampler Zone",
    sampleUrl: options.sampleUrl ?? null,
    rootKey,
    lowKey,
    highKey,
    lowVelocity,
    highVelocity,
    gain: Number(options.gain ?? 1),
    pan: Number(options.pan ?? 0),
    tuneCents: Number(options.tuneCents ?? 0),
    loopEnabled: Boolean(options.loopEnabled),
    loopStart: Math.max(0, Number(options.loopStart ?? 0)),
    loopEnd: Math.max(0, Number(options.loopEnd ?? 0)),
    roundRobinGroup: options.roundRobinGroup ?? null,
  };
}

export function matchSamplerZones(zones, note, velocity) {
  const safeNote = Number(note);
  const safeVelocity = Number(velocity);

  return (zones ?? []).filter(
    (zone) =>
      safeNote >= zone.lowKey &&
      safeNote <= zone.highKey &&
      safeVelocity >= zone.lowVelocity &&
      safeVelocity <= zone.highVelocity,
  );
}
