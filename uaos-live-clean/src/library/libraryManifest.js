export const LICENSE_STATES = Object.freeze([
  "original-uaos",
  "user-owned",
  "licensed",
  "public-domain",
  "license-review-required",
  "excluded",
]);

export const SUPPORTED_ASSET_EXTENSIONS = Object.freeze([
  ".wav",
  ".aif",
  ".aiff",
  ".flac",
  ".sfz",
  ".mid",
  ".midi",
  ".json",
]);

function assertMidiValue(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`${label} must be an integer from 0 to 127`);
  }
}

export function normalizeLibraryPath(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError("filePath must be a non-empty string");
  }

  const normalized = value
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\.\//, "");

  if (normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) {
    throw new Error("Library manifests must store relative paths");
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "..")) {
    throw new Error("Library paths may not escape the configured root");
  }

  return segments.filter((segment) => segment !== ".").join("/");
}

export function validateManifest(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    return ["manifest must be an object"];
  }

  for (const field of ["libraryId", "name", "vendor", "instrumentFamily"]) {
    if (typeof input[field] !== "string" || input[field].trim() === "") {
      errors.push(`${field} is required`);
    }
  }

  if (!LICENSE_STATES.includes(input.licenseStatus)) {
    errors.push("licenseStatus is invalid");
  }

  try {
    normalizeLibraryPath(input.filePath);
  } catch (error) {
    errors.push(error.message);
  }

  for (const rangeName of ["keyRange", "velocityRange"]) {
    const range = input[rangeName];
    if (!range || typeof range !== "object") {
      errors.push(`${rangeName} is required`);
      continue;
    }

    try {
      assertMidiValue(range.low, `${rangeName}.low`);
      assertMidiValue(range.high, `${rangeName}.high`);
      if (range.low > range.high) {
        errors.push(`${rangeName}.low may not exceed ${rangeName}.high`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (input.rootNote != null) {
    try {
      assertMidiValue(input.rootNote, "rootNote");
    } catch (error) {
      errors.push(error.message);
    }
  }

  if (!Array.isArray(input.tags)) {
    errors.push("tags must be an array");
  }

  return errors;
}

export function createLibraryManifest(input) {
  const manifest = {
    schemaVersion: 1,
    libraryId: input.libraryId,
    name: input.name,
    version: input.version || "1.0.0",
    vendor: input.vendor,
    licenseStatus: input.licenseStatus,
    sourceType: input.sourceType || "sample",
    instrumentFamily: input.instrumentFamily,
    articulation: input.articulation || "default",
    sampleRate: input.sampleRate ?? null,
    bitDepth: input.bitDepth ?? null,
    channels: input.channels ?? null,
    rootNote: input.rootNote ?? 60,
    keyRange: input.keyRange || { low: 0, high: 127 },
    velocityRange: input.velocityRange || { low: 1, high: 127 },
    loopMode: input.loopMode || "none",
    roundRobinGroup: input.roundRobinGroup || null,
    microphonePosition: input.microphonePosition || null,
    tags: Array.isArray(input.tags) ? [...input.tags] : [],
    fileHash: input.fileHash || null,
    filePath: normalizeLibraryPath(input.filePath),
    status: input.status || "ready",
  };

  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid library manifest: ${errors.join("; ")}`);
  }

  return Object.freeze({
    ...manifest,
    keyRange: Object.freeze({ ...manifest.keyRange }),
    velocityRange: Object.freeze({ ...manifest.velocityRange }),
    tags: Object.freeze([...manifest.tags]),
  });
}

export function matchesZone(zone, note, velocity) {
  assertMidiValue(note, "note");
  assertMidiValue(velocity, "velocity");

  return (
    note >= zone.keyRange.low &&
    note <= zone.keyRange.high &&
    velocity >= zone.velocityRange.low &&
    velocity <= zone.velocityRange.high
  );
}

export function selectRoundRobin(items, cursor = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return { item: null, index: -1, nextCursor: 0 };
  }

  const normalizedCursor = ((cursor % items.length) + items.length) % items.length;
  return {
    item: items[normalizedCursor],
    index: normalizedCursor,
    nextCursor: (normalizedCursor + 1) % items.length,
  };
}

export function selectZone(zones, note, velocity, cursor = 0) {
  const matches = zones.filter((zone) => matchesZone(zone, note, velocity));
  return {
    ...selectRoundRobin(matches, cursor),
    candidates: matches.length,
  };
}