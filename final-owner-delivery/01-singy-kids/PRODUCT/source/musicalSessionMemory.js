/**
 * Shared musical project/session memory for UAOS programs.
 * Does not require a browser. Does not claim musical quality.
 * Capability: uaos.session.musical-memory
 */
import { createMemoryStorage } from "./memoryStorage.js";

export const MUSICAL_SESSION_SCHEMA = "uaos.musical-session-memory/v1";
export const CAPABILITY_ID = "uaos.session.musical-memory";
export const PROJECT_KEY = "uaos.musical.project";
export const SESSION_KEY = "uaos.musical.session";

const DEFAULT_PROJECT = Object.freeze({
  schema: MUSICAL_SESSION_SCHEMA,
  projectId: "untitled",
  title: "Untitled Project",
  tempo: 96,
  meter: "4/4",
  keyCenter: "C",
  arrangement: { sections: [] },
  mixerSnapshot: { channels: [] }
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validateMusicalProject(value) {
  if (!isPlainObject(value)) return { ok: false, error: "Project must be an object." };
  if (value.schema && value.schema !== MUSICAL_SESSION_SCHEMA) {
    return { ok: false, error: "Unsupported musical session schema." };
  }
  const tempo = Number(value.tempo);
  if (value.tempo != null && (!Number.isFinite(tempo) || tempo < 30 || tempo > 260)) {
    return { ok: false, error: "Tempo must be between 30 and 260." };
  }
  if (value.arrangement && !isPlainObject(value.arrangement)) {
    return { ok: false, error: "Arrangement must be an object." };
  }
  if (value.arrangement?.sections && !Array.isArray(value.arrangement.sections)) {
    return { ok: false, error: "Arrangement sections must be an array." };
  }
  return { ok: true };
}

export function validateMusicalSession(value) {
  if (!isPlainObject(value)) return { ok: false, error: "Session must be an object." };
  if (value.schema && value.schema !== MUSICAL_SESSION_SCHEMA) {
    return { ok: false, error: "Unsupported musical session schema." };
  }
  return { ok: true };
}

function atomicWrite(storage, key, value) {
  const tmpKey = `${key}.tmp`;
  storage.setItem(tmpKey, value);
  storage.setItem(key, value);
  storage.removeItem(tmpKey);
}

export function createMusicalSessionMemory({ storage, now } = {}) {
  const store = storage || createMemoryStorage();
  const clock = typeof now === "function" ? now : () => new Date().toISOString();

  function saveProject(project) {
    const next = {
      ...DEFAULT_PROJECT,
      ...project,
      schema: MUSICAL_SESSION_SCHEMA,
      updatedAt: clock()
    };
    const check = validateMusicalProject(next);
    if (!check.ok) throw new Error(check.error);
    atomicWrite(store, PROJECT_KEY, JSON.stringify(next));
    return next;
  }

  function loadProject() {
    const raw = store.getItem(PROJECT_KEY);
    if (!raw) return { ...DEFAULT_PROJECT };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Project memory is corrupt JSON.");
    }
    const check = validateMusicalProject(parsed);
    if (!check.ok) throw new Error(check.error);
    return parsed;
  }

  function saveSession(session) {
    const next = {
      schema: MUSICAL_SESSION_SCHEMA,
      playheadMs: 0,
      transport: "stopped",
      ...session,
      schema: MUSICAL_SESSION_SCHEMA,
      updatedAt: clock()
    };
    const check = validateMusicalSession(next);
    if (!check.ok) throw new Error(check.error);
    atomicWrite(store, SESSION_KEY, JSON.stringify(next));
    return next;
  }

  function loadSession() {
    const raw = store.getItem(SESSION_KEY);
    if (!raw) return null;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Session memory is corrupt JSON.");
    }
    const check = validateMusicalSession(parsed);
    if (!check.ok) throw new Error(check.error);
    return parsed;
  }

  function restore() {
    return {
      project: loadProject(),
      session: loadSession()
    };
  }

  function clear() {
    store.removeItem(PROJECT_KEY);
    store.removeItem(SESSION_KEY);
    store.removeItem(`${PROJECT_KEY}.tmp`);
    store.removeItem(`${SESSION_KEY}.tmp`);
  }

  function snapshot() {
    const restored = restore();
    return {
      capabilityId: CAPABILITY_ID,
      schema: MUSICAL_SESSION_SCHEMA,
      hasProject: Boolean(store.getItem(PROJECT_KEY)),
      hasSession: Boolean(store.getItem(SESSION_KEY)),
      projectId: restored.project.projectId,
      tempo: restored.project.tempo,
      musicalQualityClaim: false
    };
  }

  return {
    capabilityId: CAPABILITY_ID,
    schema: MUSICAL_SESSION_SCHEMA,
    saveProject,
    loadProject,
    saveSession,
    loadSession,
    restore,
    clear,
    snapshot
  };
}
