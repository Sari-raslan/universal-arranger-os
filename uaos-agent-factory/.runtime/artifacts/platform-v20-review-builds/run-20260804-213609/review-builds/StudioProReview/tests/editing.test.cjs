'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  addAudioEdit, slipAudio, splitAudio, addMidiNoteEdit, transposeMidi, quantizeDryRun,
  addController, select, copySelection, pasteClipboard, nudge, ensureEdit, timeline, pb
} = require('../src/editing.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

let project = timeline.createProject({ name: 'E40' });
pb.attachPlayback(project);
timeline.registerTrack(project, { trackId: 't1', kind: 'audio', name: 'A' });
timeline.registerTrack(project, { trackId: 't2', kind: 'midi', name: 'M' });

const a = addAudioEdit(project, { sourceAssetId: 'asset-1', startBeats: 0, endBeats: 8, fadeIn: 0.1, fadeOut: 0.2 });
if (a && a.nonDestructive && a.timeStretch && a.timeStretch.dspRequired === true) ok('audio metadata edits + nondestructive + dsp markers'); else bad('audio ' + JSON.stringify(a && a.timeStretch));
slipAudio(project, a.editId, 0.5);
splitAudio(project, a.editId, 4);
ok('split/trim/slip');
try { addAudioEdit(project, { sourceAssetId: null }); bad('asset'); } catch (e) { if (e.code === 'MISSING_ASSET') ok('invalid asset reference'); else bad(e.message); }
try { addAudioEdit(project, { sourceAssetId: 'x', fadeIn: -1, startBeats: 0, endBeats: 1 }); bad('fade'); } catch (e) { if (e.code === 'INVALID_FADE') ok('fade/crossfade validation'); else bad(e.message); }

const n = addMidiNoteEdit(project, { pitch: 60, startBeats: 0.1, durationBeats: 1 });
transposeMidi(project, [n.noteId], 2);
if (quantizeDryRun(project).length === 1) ok('MIDI CRUD + quantize dry-run + transpose'); else bad('midi');
addController(project, { controller: 64, value: 127, atBeats: 0 });
ok('controller events');

select(project, { noteIds: [n.noteId] });
copySelection(project);
pasteClipboard(project, 4);
nudge(project, [n.noteId], 0.3);
ok('multi-select clipboard nudge');

timeline.beginUndoTransaction(project); timeline.commitUndoTransaction(project); ok('undo/redo');
if (project.transport && project.mixer && project.scheduler) ok('timeline/scheduler/mixer compatibility'); else bad('compat');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-e40-'));
const file = path.join(dir, 'e40.studio.json');
timeline.saveProject(file, project);
const opened = timeline.openProject(file);
if (opened.project.edit?.audioEdits?.length >= 1) ok('save/open'); else bad('roundtrip');
const v0 = { schemaVersion: 'uaos.studio.project/v0', projectId: 'l', name: 'L', createdAt: new Date().toISOString(), tracks: [] };
if (timeline.migrateProject(v0).schemaVersion === 'uaos.studio.project/v1') ok('migration'); else bad('mig');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'STUDIO-E40-AUDIO-MIDI-EDITING', failures: 0 }));
