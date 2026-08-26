'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CURRENT_SCHEMA = 'uaos.studio.project/v1';
const MIGRATIONS = {
  'uaos.studio.project/v0': (p) => ({
    ...p,
    schemaVersion: CURRENT_SCHEMA,
    version: p.version || 1,
    assets: Array.isArray(p.assets) ? p.assets : [],
    recovery: p.recovery || { lastAutosaveAt: null, interrupted: false },
    readOnlyCompat: p.readOnlyCompat || { minReadableVersion: 1, writable: true },
    undoBoundary: p.undoBoundary || { transactionId: null, open: false }
  })
};

function atomicWrite(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, data, 'utf8');
  fs.renameSync(tmp, filePath);
}

function journalPath(projectFile) {
  return `${projectFile}.autosave.journal.json`;
}

function createProject({ name = 'Untitled Studio Project' } = {}) {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA,
    projectId: crypto.randomUUID(),
    version: 1,
    name,
    createdAt: now,
    updatedAt: now,
    tracks: [],
    assets: [],
    recovery: { lastAutosaveAt: null, interrupted: false, lastGoodSaveAt: null },
    readOnlyCompat: { minReadableVersion: 1, writable: true },
    undoBoundary: { transactionId: null, open: false }
  };
}

function validateProject(project) {
  const errors = [];
  if (!project || typeof project !== 'object') errors.push('NOT_OBJECT');
  else {
    if (project.schemaVersion !== CURRENT_SCHEMA) errors.push('BAD_SCHEMA_VERSION');
    if (!project.projectId) errors.push('MISSING_PROJECT_ID');
    if (typeof project.version !== 'number' || project.version < 1) errors.push('BAD_VERSION');
    if (!Array.isArray(project.tracks)) errors.push('TRACKS_NOT_ARRAY');
    if (!Array.isArray(project.assets)) errors.push('ASSETS_NOT_ARRAY');
    if (!project.recovery || typeof project.recovery !== 'object') errors.push('MISSING_RECOVERY');
  }
  return { ok: errors.length === 0, errors };
}

function migrateProject(project) {
  let cur = project;
  const seen = new Set();
  while (cur.schemaVersion !== CURRENT_SCHEMA) {
    if (seen.has(cur.schemaVersion)) throw new Error('MIGRATION_LOOP');
    seen.add(cur.schemaVersion);
    const fn = MIGRATIONS[cur.schemaVersion];
    if (!fn) throw new Error(`NO_MIGRATION_FROM:${cur.schemaVersion}`);
    cur = fn(cur);
  }
  return cur;
}

function checkReadOnlyCompat(project) {
  const c = project.readOnlyCompat || { minReadableVersion: 1, writable: true };
  if (project.version < c.minReadableVersion) {
    return { readable: false, writable: false, reason: 'VERSION_TOO_OLD' };
  }
  return { readable: true, writable: !!c.writable, reason: null };
}

function registerTrack(project, track) {
  if (!track || !track.trackId) throw new Error('INVALID_TRACK');
  if (project.tracks.some((t) => t.trackId === track.trackId)) throw new Error('DUPLICATE_TRACK');
  project.tracks.push({
    trackId: track.trackId,
    kind: track.kind || 'audio',
    name: track.name || track.trackId
  });
  project.updatedAt = new Date().toISOString();
  return project;
}

function addAssetRef(project, asset) {
  if (!asset || !asset.assetId) throw new Error('INVALID_ASSET');
  const missing = !!asset.missing || !asset.uri;
  project.assets.push({
    assetId: asset.assetId,
    uri: asset.uri || '',
    missing
  });
  project.updatedAt = new Date().toISOString();
  return project;
}

function missingAssets(project) {
  return (project.assets || []).filter((a) => a.missing || !a.uri);
}

function beginUndoTransaction(project) {
  if (project.undoBoundary && project.undoBoundary.open) throw new Error('UNDO_TX_ALREADY_OPEN');
  project.undoBoundary = { transactionId: crypto.randomUUID(), open: true, startedAt: new Date().toISOString() };
  return project;
}

function commitUndoTransaction(project) {
  if (!project.undoBoundary || !project.undoBoundary.open) throw new Error('NO_OPEN_UNDO_TX');
  project.undoBoundary.open = false;
  project.undoBoundary.committedAt = new Date().toISOString();
  return project;
}

function saveProject(filePath, project, { simulateInterrupt = false } = {}) {
  const v = validateProject(project);
  if (!v.ok) {
    const err = new Error(`INVALID_PROJECT:${v.errors.join(',')}`);
    err.validationErrors = v.errors;
    throw err;
  }
  const compat = checkReadOnlyCompat(project);
  if (!compat.writable) throw new Error('READ_ONLY_PROJECT');

  const now = new Date().toISOString();
  project.updatedAt = now;
  project.version = (project.version || 1) + 0; // keep version; bump via explicit migrate if needed
  const payload = JSON.stringify(project, null, 2);

  // autosave journal first
  const jPath = journalPath(filePath);
  atomicWrite(jPath, JSON.stringify({
    projectId: project.projectId,
    at: now,
    interrupted: !!simulateInterrupt,
    bytes: Buffer.byteLength(payload)
  }, null, 2));

  if (simulateInterrupt) {
    project.recovery.interrupted = true;
    const partial = path.join(path.dirname(filePath), `.${path.basename(filePath)}.partial`);
    fs.writeFileSync(partial, payload.slice(0, Math.max(10, Math.floor(payload.length / 2))), 'utf8');
    const err = new Error('SAVE_INTERRUPTED');
    err.code = 'SAVE_INTERRUPTED';
    err.journal = jPath;
    throw err;
  }

  atomicWrite(filePath, payload);
  project.recovery.lastGoodSaveAt = now;
  project.recovery.interrupted = false;
  project.recovery.lastAutosaveAt = now;
  atomicWrite(jPath, JSON.stringify({
    projectId: project.projectId,
    at: now,
    interrupted: false,
    committed: true
  }, null, 2));
  return project;
}

function recoverFromJournal(filePath) {
  const jPath = journalPath(filePath);
  if (!fs.existsSync(jPath)) return { recovered: false, reason: 'NO_JOURNAL' };
  const journal = JSON.parse(fs.readFileSync(jPath, 'utf8'));
  if (journal.interrupted) {
    return { recovered: false, reason: 'INTERRUPTED_NEEDS_USER', journal };
  }
  if (fs.existsSync(filePath)) {
    return { recovered: true, reason: 'LAST_GOOD_PRESENT', journal };
  }
  return { recovered: false, reason: 'MISSING_PROJECT_FILE', journal };
}

function openProject(filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  let project = JSON.parse(raw);
  if (project.schemaVersion !== CURRENT_SCHEMA) {
    project = migrateProject(project);
  }
  const v = validateProject(project);
  if (!v.ok) {
    const err = new Error(`INVALID_PROJECT:${v.errors.join(',')}`);
    err.validationErrors = v.errors;
    throw err;
  }
  const compat = checkReadOnlyCompat(project);
  if (!compat.readable) throw new Error('INCOMPATIBLE_VERSION');
  return { project, compat, missingAssets: missingAssets(project) };
}

module.exports = {
  CURRENT_SCHEMA,
  createProject,
  validateProject,
  migrateProject,
  checkReadOnlyCompat,
  registerTrack,
  addAssetRef,
  missingAssets,
  beginUndoTransaction,
  commitUndoTransaction,
  saveProject,
  openProject,
  recoverFromJournal,
  journalPath,
  atomicWrite
};
