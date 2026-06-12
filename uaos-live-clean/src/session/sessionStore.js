export const PROJECT_VERSION = 1;
export const SESSION_KEY = "uaos_v1_session";
const AUTOSAVE_KEY = "uaos_v1_autosave";

export function createDefaultSession() {
  return {
    version: PROJECT_VERSION,
    name: "My UAOS Session",
    bpm: 96,
    chord: "Cm",
    timeline: [],
    arranger: null,
    midiMappings: {},
    updatedAt: new Date().toISOString()
  };
}

export function validateSession(value) {
  if (!value || typeof value !== "object") return { ok: false, error: "Session must be an object." };
  if (value.version && Number(value.version) > PROJECT_VERSION) return { ok: false, error: "Session version is newer than this app." };
  if (value.name && typeof value.name !== "string") return { ok: false, error: "Session name must be text." };
  if (value.bpm && (!Number.isFinite(Number(value.bpm)) || Number(value.bpm) < 30 || Number(value.bpm) > 260)) return { ok: false, error: "BPM must be between 30 and 260." };
  if (value.timeline && !Array.isArray(value.timeline)) return { ok: false, error: "Timeline must be an array." };
  return { ok: true };
}

export function migrateSession(value) {
  const base = createDefaultSession();
  const next = { ...base, ...value, version: PROJECT_VERSION };
  next.bpm = Math.max(30, Math.min(260, Number(next.bpm || base.bpm)));
  next.updatedAt = new Date().toISOString();
  return next;
}

export function saveSession(session, storage = localStorage, key = SESSION_KEY) {
  const migrated = migrateSession(session);
  const validation = validateSession(migrated);
  if (!validation.ok) throw new Error(validation.error);
  storage.setItem(key, JSON.stringify(migrated));
  return migrated;
}

export function loadSession(storage = localStorage, key = SESSION_KEY) {
  const raw = storage.getItem(key);
  if (!raw) return createDefaultSession();
  const parsed = JSON.parse(raw);
  const validation = validateSession(parsed);
  if (!validation.ok) throw new Error(validation.error);
  return migrateSession(parsed);
}

export function clearSession(storage = localStorage) {
  storage.removeItem(SESSION_KEY);
  storage.removeItem(AUTOSAVE_KEY);
}

export function autosaveSession(session, storage = localStorage) {
  try {
    return saveSession(session, storage, AUTOSAVE_KEY);
  } catch (error) {
    return { error: error.message };
  }
}

export function exportSession(session) {
  return JSON.stringify(migrateSession(session), null, 2);
}

export function importSession(text) {
  const parsed = JSON.parse(text);
  const validation = validateSession(parsed);
  if (!validation.ok) throw new Error(validation.error);
  return migrateSession(parsed);
}

