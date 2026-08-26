'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createProjectV2, saveProject, openProject, beginUndo, commitUndo, setTransport, globalStop, migrateV1toV2
} = require('../src/phase2.cjs');
const {
  registerRoleTrack, addNote, editNote, deleteNote, moveNote, resizeNote, createMidiClip,
  duplicateMidiClip, splitMidiClip, mergeMidiClips, transposeNotes, quantizeDryRun,
  addSection, addChord, setArrangementGraph, validateArrangement, ensureComposition
} = require('../src/phase3.cjs');
const { FeatureFlags, Entitlements, readJson } = require('../src/shell.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

let p = createProjectV2({ name: 'P3' });
registerRoleTrack(p, { trackId: 'mel', role: 'melody' });
registerRoleTrack(p, { trackId: 'ch', role: 'chord' });
registerRoleTrack(p, { trackId: 'bs', role: 'bass' });
registerRoleTrack(p, { trackId: 'dr', role: 'drum' });
ok('track role enforcement setup');
try { registerRoleTrack(p, { trackId: 'x', role: 'lead' }); bad('role'); } catch (e) { if (e.code === 'INVALID_TRACK_ROLE') ok('invalid role rejection'); else bad(e.message); }

const n = addNote(p, { pitch: 60, startBeats: 0.1, durationBeats: 1, velocity: 90 });
editNote(p, n.noteId, { velocity: 100 });
moveNote(p, n.noteId, 1);
resizeNote(p, n.noteId, 2);
ok('note CRUD/move/resize');
try { addNote(p, { pitch: 200, startBeats: 0, durationBeats: 1 }); bad('pitch'); } catch (e) { if (e.code === 'INVALID_NOTE') ok('invalid note rejection'); else bad(e.message); }

const clip = createMidiClip(p, { trackId: 'mel', startBeats: 0, durationBeats: 4, noteIds: [n.noteId] });
duplicateMidiClip(p, clip.clipId);
const right = splitMidiClip(p, clip.clipId, 2);
mergeMidiClips(p, clip.clipId, right.clipId);
ok('clip operations');

transposeNotes(p, [n.noteId], 2);
if (ensureComposition(p).notes.find((x) => x.noteId === n.noteId).pitch === 62) ok('transpose'); else bad('transpose');
const q = quantizeDryRun(p);
if (q.length >= 1) ok('quantize dry-run'); else bad('quantize');

addSection(p, { kind: 'intro', startBeats: 0, endBeats: 4 });
addSection(p, { kind: 'verse', startBeats: 4, endBeats: 12 });
addSection(p, { kind: 'chorus', startBeats: 12, endBeats: 20 });
addChord(p, { symbol: 'Am', startBeats: 0 });
ok('section + chord serialization fields');

setArrangementGraph(p, [{ id: 'a', section: 'intro' }, { id: 'b', section: 'verse' }], [{ from: 'a', to: 'b' }]);
if (validateArrangement(p).ok) ok('arrangement graph validation'); else bad('arr');

beginUndo(p); commitUndo(p); ok('undo/redo');
setTransport(p, 'playing'); globalStop(p); ok('transport compatibility');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-p3-'));
const file = path.join(dir, 'p3.creator.json');
saveProject(file, p);
const loaded = openProject(file);
if (loaded.composition?.midiClips?.length >= 1) ok('save/open round-trip'); else bad('roundtrip');

const v1 = { schemaVersion: 'uaos.creator.project/v1', projectId: 'x', name: 'v1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tracks: [], assets: [] };
if (migrateV1toV2(v1).schemaVersion === 'uaos.creator.project/v2') ok('migration'); else bad('migration');

const flags = new FeatureFlags(readJson(path.join(__dirname, '..', 'contracts', 'feature-flags.json')).flags);
const ents = new Entitlements('creator.free', readJson(path.join(__dirname, '..', 'contracts', 'entitlements.json')));
try { flags.enforce('voice.to.midi'); bad('ff'); } catch (e) { if (e.code === 'FEATURE_FLAG_DISABLED') ok('feature flags'); else bad(e.message); }
try { ents.enforce('voice.to.midi'); bad('ent'); } catch (e) { if (e.code === 'ENTITLEMENT_REQUIRED') ok('entitlements'); else bad(e.message); }
if (ensureComposition(p).voiceToMidi.status === 'CONTRACT_ONLY') ok('voice-to-midi contract only'); else bad('v2m');

deleteNote(p, n.noteId); ok('delete note');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'CREATOR-PHASE3-COMPOSITION-CORE', failures: 0 }));
