export const UMS_SCHEMA_VERSION = "0.1.0";

export function createUmsProject(input = {}) {
  const now = new Date().toISOString();
  const id = normalizeId(input.id) || `ums-${Date.now()}`;
  return {
    schema: "uaos.music-scene",
    schemaVersion: UMS_SCHEMA_VERSION,
    id,
    metadata: {
      title: cleanText(input.title, "Untitled"),
      artist: cleanText(input.artist, ""),
      durationMs: finiteNumber(input.durationMs, 0),
      sourceFileName: cleanText(input.sourceFileName, ""),
      createdAt: now,
      updatedAt: now
    },
    rights: {
      category: input.rightsCategory || "user-private-project",
      ownershipConfirmed: input.ownershipConfirmed === true,
      commercialUseAllowed: input.commercialUseAllowed === true,
      trainingAllowed: false,
      provenance: []
    },
    timeline: {
      tempoMap: [{ tick: 0, bpm: finiteNumber(input.bpm, 120), confidence: 0 }],
      timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
      sections: []
    },
    harmony: {
      key: null,
      chords: [],
      maqam: null,
      ajnas: [],
      modulations: [],
      quarterToneSystem: null
    },
    tracks: [],
    automation: [],
    deviceMappings: [],
    analysis: {
      status: "not-analyzed",
      providers: [],
      confidence: {},
      warnings: ["No AI analysis has been executed."]
    },
    versions: [{ version: 1, createdAt: now, reason: "project-created" }]
  };
}

export function addSection(project, section) {
  assertProject(project);
  const next = structuredClone(project);
  next.timeline.sections.push({
    id: normalizeId(section.id) || `section-${next.timeline.sections.length + 1}`,
    type: cleanText(section.type, "unknown"),
    name: cleanText(section.name, section.type || "Section"),
    startMs: finiteNumber(section.startMs, 0),
    endMs: finiteNumber(section.endMs, 0),
    confidence: clamp01(section.confidence ?? 0),
    source: cleanText(section.source, "manual")
  });
  next.metadata.updatedAt = new Date().toISOString();
  return next;
}

export function addTrack(project, track) {
  assertProject(project);
  const next = structuredClone(project);
  next.tracks.push({
    id: normalizeId(track.id) || `track-${next.tracks.length + 1}`,
    name: cleanText(track.name, "Track"),
    role: cleanText(track.role, "unknown"),
    kind: ["audio", "midi", "hybrid"].includes(track.kind) ? track.kind : "audio",
    audioRef: track.audioRef || null,
    midiEvents: Array.isArray(track.midiEvents) ? track.midiEvents : [],
    articulations: Array.isArray(track.articulations) ? track.articulations : [],
    expression: track.expression && typeof track.expression === "object" ? track.expression : {},
    confidence: clamp01(track.confidence ?? 0),
    source: cleanText(track.source, "manual")
  });
  next.metadata.updatedAt = new Date().toISOString();
  return next;
}

export function validateUmsProject(project) {
  const errors = [];
  if (!project || typeof project !== "object") errors.push("project must be an object");
  if (project?.schema !== "uaos.music-scene") errors.push("invalid schema");
  if (!project?.id) errors.push("missing id");
  if (!project?.metadata?.title) errors.push("missing title");
  if (!Array.isArray(project?.tracks)) errors.push("tracks must be an array");
  if (!Array.isArray(project?.timeline?.sections)) errors.push("sections must be an array");
  if (!Array.isArray(project?.versions)) errors.push("versions must be an array");
  return { valid: errors.length === 0, errors };
}

export function serializeUmsProject(project) {
  const result = validateUmsProject(project);
  if (!result.valid) throw new Error(result.errors.join("; "));
  return JSON.stringify(project, null, 2);
}

function assertProject(project) {
  const result = validateUmsProject(project);
  if (!result.valid) throw new Error(result.errors.join("; "));
}

function normalizeId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 96);
}

function cleanText(value, fallback) {
  const result = String(value ?? "").replace(/[\0\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  return (result || fallback).slice(0, 240);
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finiteNumber(value, 0)));
}
