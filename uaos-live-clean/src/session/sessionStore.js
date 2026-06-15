import { createDisabledRemoteProvider } from "../ai/aiProvider.js";
import { migratePhase9State } from "../beta/phase9Beta.js";
import { migrateCloudState } from "../cloud/cloudPhase8.js";
import { migrateDawProject } from "../daw/dawPhase7.js";
import { migrateHardwareSession } from "../hardware/hardwarePhase6.js";
import { createLibraryCatalog } from "../library/libraryCatalog.js";
import { migrateSamplerPreset } from "../sampler/samplerEngine.js";

export const PROJECT_VERSION = 7;
export const SESSION_KEY = "uaos_v1_session";
const AUTOSAVE_KEY = "uaos_v1_autosave";

function createAudioState(overrides = {}) {
  return {
    schemaVersion: 1,
    masterGain: 0.9,
    muted: false,
    solo: [],
    channels: ["master", "sampler", "arranger", "recording"],
    ...overrides,
  };
}

function createRecordingSessionState(overrides = {}) {
  return {
    schemaVersion: 1,
    clips: [],
    selectedMicrophoneId: null,
    permissionState: "unknown",
    rawAudioInLocalStorage: false,
    ...overrides,
    clips: Array.isArray(overrides.clips) ? overrides.clips : [],
    rawAudioInLocalStorage: false,
  };
}

function createSamplerState(overrides = {}) {
  const presets = Array.isArray(overrides.presets)
    ? overrides.presets.map((preset) => {
        try {
          return migrateSamplerPreset(preset);
        } catch {
          return null;
        }
      }).filter(Boolean)
    : [];

  return {
    schemaVersion: 2,
    selectedPresetId: overrides.selectedPresetId || presets[0]?.id || null,
    presets,
    missingAssets: Array.isArray(overrides.missingAssets) ? overrides.missingAssets : [],
  };
}

function createAiMusicState(overrides = {}) {
  return {
    schemaVersion: 1,
    provider: {
      ...createDisabledRemoteProvider(),
      ...(overrides.provider || {}),
      remoteEnabled: false,
      status: "disabled",
    },
    analyses: Array.isArray(overrides.analyses) ? overrides.analyses : [],
    jobs: Array.isArray(overrides.jobs) ? overrides.jobs : [],
    remoteUploadsEnabled: false,
  };
}

export function createDefaultSession() {
  return {
    version: PROJECT_VERSION,
    name: "My UAOS Session",
    bpm: 96,
    chord: "Cm",
    timeline: [],
    arranger: null,
    midiMappings: {},
    audio: createAudioState(),
    sampler: createSamplerState(),
    library: createLibraryCatalog([]),
    recording: createRecordingSessionState(),
    aiMusic: createAiMusicState(),
    hardware: migrateHardwareSession(),
    dawProject: migrateDawProject(),
    cloud: migrateCloudState(),
    beta: migratePhase9State(),
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
  const source = value && typeof value === "object" ? value : {};
  const next = { ...base, ...source, version: PROJECT_VERSION };
  next.bpm = Math.max(30, Math.min(260, Number(next.bpm || base.bpm)));
  next.audio = createAudioState(source.audio);
  next.sampler = createSamplerState(source.sampler);
  next.library = source.library?.schemaVersion ? source.library : createLibraryCatalog(source.library?.items || []);
  next.recording = createRecordingSessionState(source.recording);
  next.aiMusic = createAiMusicState(source.aiMusic);
  next.hardware = migrateHardwareSession(source.hardware);
  next.dawProject = migrateDawProject(source.dawProject);
  next.cloud = migrateCloudState(source.cloud);
  next.beta = migratePhase9State(source.beta);
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

