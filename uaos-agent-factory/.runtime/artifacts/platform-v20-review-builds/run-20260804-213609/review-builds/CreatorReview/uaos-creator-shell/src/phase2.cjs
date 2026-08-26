'use strict';
/**
 * UAOS Creator Phase2 — Project Workspace + Transport
 * Extends V15 shell. Advanced engines NOT implemented.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const shell = require('./shell.cjs');

const SCHEMA = 'uaos.creator.project/v2';

function journalPath(file) { return `${file}.autosave.journal.json`; }

function createProjectV2({ name = 'Untitled Creator Project' } = {}) {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA,
    projectId: crypto.randomUUID(),
    version: 1,
    name,
    createdAt: now,
    updatedAt: now,
    tracks: [],
    clips: [],
    assets: [],
    transport: { state: 'stopped', positionBeats: 0, loop: null },
    recovery: { lastAutosaveAt: null, interrupted: false, lastGoodSaveAt: null },
    undoBoundary: { transactionId: null, open: false },
    featureFlags: {},
    entitlements: {}
  };
}

function validateProjectV2(p) {
  const errors = [];
  if (!p || typeof p !== 'object') return { ok: false, errors: ['NOT_OBJECT'] };
  if (p.schemaVersion !== SCHEMA) errors.push('BAD_SCHEMA');
  if (!p.projectId) errors.push('MISSING_PROJECT_ID');
  if (typeof p.version !== 'number' || p.version < 1) errors.push('BAD_VERSION');
  if (!Array.isArray(p.tracks)) errors.push('TRACKS');
  if (!Array.isArray(p.clips)) errors.push('CLIPS');
  if (!p.transport || !['stopped', 'playing', 'paused'].includes(p.transport.state)) errors.push('TRANSPORT');
  if (!p.recovery) errors.push('RECOVERY');
  return { ok: errors.length === 0, errors };
}

function migrateV1toV2(p) {
  if (p.schemaVersion === SCHEMA) return p;
  if (p.schemaVersion !== 'uaos.creator.project/v1') throw new Error(`NO_MIGRATION:${p.schemaVersion}`);
  return {
    ...p,
    schemaVersion: SCHEMA,
    version: p.version || 1,
    clips: Array.isArray(p.clips) ? p.clips : [],
    transport: p.transport || { state: 'stopped', positionBeats: 0, loop: null },
    recovery: p.recovery || { lastAutosaveAt: null, interrupted: false, lastGoodSaveAt: null },
    undoBoundary: p.undoBoundary || { transactionId: null, open: false }
  };
}

function registerTrack(project, { trackId, kind, name }) {
  if (!trackId) throw Object.assign(new Error('INVALID_TRACK'), { code: 'INVALID_TRACK' });
  if (!['audio', 'midi'].includes(kind)) throw Object.assign(new Error('INVALID_TRACK_KIND'), { code: 'INVALID_TRACK_KIND' });
  if (project.tracks.some((t) => t.trackId === trackId)) throw Object.assign(new Error('DUPLICATE_TRACK'), { code: 'DUPLICATE_TRACK' });
  project.tracks.push({ trackId, kind, name: name || trackId });
  project.updatedAt = new Date().toISOString();
  return project;
}

function addClipMeta(project, clip) {
  if (!clip || !clip.clipId || !clip.trackId) throw Object.assign(new Error('INVALID_CLIP'), { code: 'INVALID_CLIP' });
  if (!project.tracks.some((t) => t.trackId === clip.trackId)) throw Object.assign(new Error('MISSING_TRACK'), { code: 'MISSING_TRACK' });
  project.clips.push({
    clipId: clip.clipId,
    trackId: clip.trackId,
    kind: clip.kind || 'audio',
    startBeats: clip.startBeats || 0,
    durationBeats: clip.durationBeats || 1,
    name: clip.name || clip.clipId
  });
  project.updatedAt = new Date().toISOString();
  return project;
}

function beginUndo(project) {
  if (project.undoBoundary?.open) throw Object.assign(new Error('UNDO_TX_OPEN'), { code: 'UNDO_TX_OPEN' });
  project.undoBoundary = { transactionId: crypto.randomUUID(), open: true, startedAt: new Date().toISOString() };
  return project;
}
function commitUndo(project) {
  if (!project.undoBoundary?.open) throw Object.assign(new Error('NO_UNDO_TX'), { code: 'NO_UNDO_TX' });
  project.undoBoundary.open = false;
  project.undoBoundary.committedAt = new Date().toISOString();
  return project;
}

const ALLOWED = {
  stopped: ['playing'],
  playing: ['paused', 'stopped'],
  paused: ['playing', 'stopped']
};

function setTransport(project, next) {
  const cur = project.transport.state;
  if (next === cur) return project;
  if (!(ALLOWED[cur] || []).includes(next)) {
    throw Object.assign(new Error(`INVALID_TRANSPORT:${cur}->${next}`), { code: 'INVALID_TRANSPORT' });
  }
  project.transport.state = next;
  project.updatedAt = new Date().toISOString();
  return project;
}

function globalStop(project) {
  project.transport.state = 'stopped';
  project.updatedAt = new Date().toISOString();
  return project;
}

function seek(project, positionBeats) {
  if (typeof positionBeats !== 'number' || positionBeats < 0) {
    throw Object.assign(new Error('INVALID_SEEK'), { code: 'INVALID_SEEK' });
  }
  project.transport.positionBeats = positionBeats;
  return project;
}

function setLoop(project, loop) {
  if (loop === null) { project.transport.loop = null; return project; }
  if (!loop || typeof loop.startBeats !== 'number' || typeof loop.endBeats !== 'number' || loop.endBeats <= loop.startBeats) {
    throw Object.assign(new Error('INVALID_LOOP'), { code: 'INVALID_LOOP' });
  }
  project.transport.loop = { startBeats: loop.startBeats, endBeats: loop.endBeats };
  return project;
}

function saveProject(filePath, project, { simulateInterrupt = false } = {}) {
  const v = validateProjectV2(project);
  if (!v.ok) throw Object.assign(new Error(`INVALID_PROJECT:${v.errors.join(',')}`), { code: 'INVALID_PROJECT', validationErrors: v.errors });
  const now = new Date().toISOString();
  project.updatedAt = now;
  const payload = JSON.stringify(project, null, 2);
  const j = journalPath(filePath);
  shell.atomicWrite(j, JSON.stringify({ projectId: project.projectId, at: now, interrupted: !!simulateInterrupt }, null, 2));
  if (simulateInterrupt) {
    project.recovery.interrupted = true;
    const partial = path.join(path.dirname(filePath), `.${path.basename(filePath)}.partial`);
    fs.writeFileSync(partial, payload.slice(0, Math.max(20, Math.floor(payload.length / 2))), 'utf8');
    throw Object.assign(new Error('SAVE_INTERRUPTED'), { code: 'SAVE_INTERRUPTED', journal: j });
  }
  shell.atomicWrite(filePath, payload);
  project.recovery.lastGoodSaveAt = now;
  project.recovery.lastAutosaveAt = now;
  project.recovery.interrupted = false;
  shell.atomicWrite(j, JSON.stringify({ projectId: project.projectId, at: now, interrupted: false, committed: true }, null, 2));
  return project;
}

function openProject(filePath) {
  let p = shell.readJson(filePath);
  if (p.schemaVersion === 'uaos.creator.project/v1') p = migrateV1toV2(p);
  const v = validateProjectV2(p);
  if (!v.ok) throw Object.assign(new Error(`INVALID_PROJECT:${v.errors.join(',')}`), { code: 'INVALID_PROJECT', validationErrors: v.errors });
  return p;
}

function recoverJournal(filePath) {
  const j = journalPath(filePath);
  if (!fs.existsSync(j)) return { recovered: false, reason: 'NO_JOURNAL' };
  const journal = shell.readJson(j);
  if (journal.interrupted) return { recovered: false, reason: 'INTERRUPTED_NEEDS_USER', journal };
  if (fs.existsSync(filePath)) return { recovered: true, reason: 'LAST_GOOD_PRESENT', journal };
  return { recovered: false, reason: 'MISSING_PROJECT_FILE', journal };
}

function wireCommandBus(bus, evidence, flags, ents) {
  bus.register('project.create', () => { evidence.emit('project.create'); return createProjectV2(); });
  bus.register('project.save', ({ filePath, project }) => {
    flags.enforce('shell.enabled');
    ents.enforce('project.save');
    evidence.emit('project.save');
    return saveProject(filePath, project);
  });
  bus.register('project.open', ({ filePath }) => {
    flags.enforce('shell.enabled');
    ents.enforce('project.open');
    evidence.emit('project.open');
    return openProject(filePath);
  });
  bus.register('transport.play', ({ project }) => setTransport(project, 'playing'));
  bus.register('transport.pause', ({ project }) => setTransport(project, 'paused'));
  bus.register('transport.stop', ({ project }) => globalStop(project));
  return bus;
}

module.exports = {
  SCHEMA,
  createProjectV2,
  validateProjectV2,
  migrateV1toV2,
  registerTrack,
  addClipMeta,
  beginUndo,
  commitUndo,
  setTransport,
  globalStop,
  seek,
  setLoop,
  saveProject,
  openProject,
  recoverJournal,
  wireCommandBus,
  shell
};
