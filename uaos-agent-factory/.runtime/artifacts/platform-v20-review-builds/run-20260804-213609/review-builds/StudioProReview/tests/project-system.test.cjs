'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createProject, validateProject, migrateProject, registerTrack, addAssetRef,
  missingAssets, beginUndoTransaction, commitUndoTransaction,
  saveProject, openProject, recoverFromJournal
} = require('../src/project-system.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-studio-p1-'));
const file = path.join(dir, 'demo.studio.json');

// New project
let p = createProject({ name: 'Phase1 Demo' });
if (validateProject(p).ok) ok('new project'); else bad('new project');

// Tracks + assets
registerTrack(p, { trackId: 't1', kind: 'midi', name: 'MIDI 1' });
addAssetRef(p, { assetId: 'a1', uri: 'file://samples/kick.wav' });
addAssetRef(p, { assetId: 'a2', uri: '', missing: true });
if (missingAssets(p).length === 1) ok('missing asset handling'); else bad('missing assets');

// Undo boundary
beginUndoTransaction(p);
commitUndoTransaction(p);
if (p.undoBoundary.open === false) ok('undo transaction boundary'); else bad('undo');

// Atomic save + round-trip
saveProject(file, p);
const opened = openProject(file);
if (opened.project.projectId === p.projectId) ok('save/open round-trip'); else bad('round-trip');
if (opened.compat.readable) ok('version compatibility'); else bad('compat');

// Autosave journal present
const recovered = recoverFromJournal(file);
if (recovered.recovered) ok('autosave journal'); else bad('journal');

// Interrupted save recovery metadata
const file2 = path.join(dir, 'interrupt.studio.json');
let p2 = createProject({ name: 'Interrupt' });
try {
  saveProject(file2, p2, { simulateInterrupt: true });
  bad('expected interrupt');
} catch (e) {
  if (e.code === 'SAVE_INTERRUPTED') {
    const r = recoverFromJournal(file2);
    if (r.reason === 'INTERRUPTED_NEEDS_USER') ok('interrupted save recovery'); else bad('interrupt reason');
  } else bad(e.message);
}

// Schema migration v0 -> v1
const v0 = {
  schemaVersion: 'uaos.studio.project/v0',
  projectId: 'legacy',
  name: 'Legacy',
  createdAt: new Date().toISOString(),
  tracks: [{ trackId: 't1', kind: 'audio', name: 'A' }]
};
const migrated = migrateProject(v0);
if (migrated.schemaVersion === 'uaos.studio.project/v1' && Array.isArray(migrated.assets)) ok('schema migration'); else bad('migration');

// Invalid rejection
const badP = { schemaVersion: 'uaos.studio.project/v1', projectId: '', version: 0, tracks: null, assets: null };
if (!validateProject(badP).ok) ok('invalid project rejection'); else bad('should reject');

try {
  saveProject(path.join(dir, 'bad.json'), badP);
  bad('save should reject invalid');
} catch (e) {
  if (String(e.message).startsWith('INVALID_PROJECT')) ok('atomic write rejects invalid'); else bad(e.message);
}

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'STUDIO-E10-PROJECT-SYSTEM', failures: 0 }));
