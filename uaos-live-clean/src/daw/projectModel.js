function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return prefix + "-" + globalThis.crypto.randomUUID();
  }

  return prefix + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

export function createProject(options = {}) {
  const tempo = Number(options.tempo ?? 120);

  if (!Number.isFinite(tempo) || tempo < 20 || tempo > 400) {
    throw new RangeError("Project tempo must be between 20 and 400 BPM.");
  }

  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    id: options.id ?? createId("project"),
    name: options.name ?? "Untitled UAOS Project",
    tempo,
    timeSignature: options.timeSignature ?? "4/4",
    keySignature: options.keySignature ?? null,
    tracks: Array.isArray(options.tracks) ? options.tracks : [],
    markers: Array.isArray(options.markers) ? options.markers : [],
    arranger: options.arranger ?? null,
    metadata: {
      createdAt: options.metadata?.createdAt ?? now,
      updatedAt: now,
      author: options.metadata?.author ?? null,
      description: options.metadata?.description ?? "",
    },
  };
}

export function addTrackToProject(project, track) {
  if (!project || !track) {
    throw new TypeError("Project and track are required.");
  }

  return {
    ...project,
    tracks: [...(project.tracks ?? []), track],
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function removeTrackFromProject(project, trackId) {
  return {
    ...project,
    tracks: (project.tracks ?? []).filter((track) => track.id !== trackId),
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function serializeProject(project) {
  if (!project || typeof project !== "object") {
    throw new TypeError("A project object is required.");
  }

  return JSON.stringify(project, null, 2);
}

export function parseProject(json) {
  const project = JSON.parse(json);

  if (project.schemaVersion !== 1) {
    throw new Error("Unsupported UAOS project schema version.");
  }

  if (!Array.isArray(project.tracks)) {
    throw new Error("UAOS project tracks must be an array.");
  }

  return project;
}
