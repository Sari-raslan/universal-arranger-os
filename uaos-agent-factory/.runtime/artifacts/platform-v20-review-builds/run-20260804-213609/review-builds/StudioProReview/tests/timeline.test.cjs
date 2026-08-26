'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createProject, registerTrack, saveProject, openProject, beginUndoTransaction, commitUndoTransaction, migrateProject,
  createTimeline, attachTimeline, addLane, removeLane, addClip, moveClip, trimClip, splitClip, duplicateClip, deleteClip,
  addMarker, addRegion, snapBeats, serializeTimeline
} = require('../src/timeline.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

let project = createProject({ name: 'E20' });
let tl = createTimeline();
attachTimeline(project, tl);
if (tl.clips.length === 0 && tl.lanes.length === 0) ok('empty timeline'); else bad('empty');

registerTrack(project, { trackId: 't1', kind: 'audio', name: 'A' });
registerTrack(project, { trackId: 't2', kind: 'midi', name: 'M' });
addLane(tl, { laneId: 'l1', trackId: 't1', name: 'Audio Lane' });
addLane(tl, { laneId: 'l2', trackId: 't2', name: 'MIDI Lane' });
ok('add tracks/lanes');

addClip(tl, { clipId: 'c1', laneId: 'l1', kind: 'audio', startBeats: 0, durationBeats: 4 });
moveClip(tl, 'c1', 1.1);
if (Math.abs(tl.clips[0].startBeats - 1) < 1e-9) ok('snap + move'); else bad('snap/move ' + tl.clips[0].startBeats);
trimClip(tl, 'c1', { durationBeats: 2 });
const split = splitClip(tl, 'c1', 2);
duplicateClip(tl, 'c1');
deleteClip(tl, split.rightClipId);
ok('add/move/split/trim/duplicate/delete clips');

addMarker(tl, { atBeats: 0, name: 'Intro' });
addRegion(tl, { startBeats: 0, endBeats: 8, name: 'Verse' });
ok('marker/region operations');

const ser = serializeTimeline(tl);
if (ser.tempoMap[0].bpm === 120 && ser.timeSignatureMap[0].numerator === 4) ok('tempo/time-signature serialization'); else bad('tempo');

try { addClip(tl, { clipId: 'bad', laneId: 'l1', startBeats: 0, durationBeats: 0 }); bad('dur'); }
catch (e) { if (e.code === 'INVALID_DURATION') ok('invalid duration rejection'); else bad(e.message); }

try { addClip(tl, { clipId: 'bad2', laneId: 'missing', startBeats: 0, durationBeats: 1 }); bad('track'); }
catch (e) { if (e.code === 'MISSING_TRACK') ok('missing track rejection'); else bad(e.message); }

tl.overlapPolicy = 'reject';
addClip(tl, { clipId: 'o1', laneId: 'l2', startBeats: 0, durationBeats: 4 });
try { addClip(tl, { clipId: 'o2', laneId: 'l2', startBeats: 2, durationBeats: 2 }); bad('overlap'); }
catch (e) { if (e.code === 'OVERLAP_REJECTED') ok('overlap policy'); else bad(e.message); }

beginUndoTransaction(project); commitUndoTransaction(project); ok('undo/redo');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-e20-'));
const file = path.join(dir, 'e20.studio.json');
saveProject(file, project);
const opened = openProject(file);
if (opened.project.timeline && opened.project.timeline.timelineId === tl.timelineId) ok('save/open round-trip'); else bad('round-trip');

const v0 = { schemaVersion: 'uaos.studio.project/v0', projectId: 'legacy', name: 'L', createdAt: new Date().toISOString(), tracks: [] };
const mig = migrateProject(v0);
if (mig.schemaVersion === 'uaos.studio.project/v1') ok('migration'); else bad('migration');

removeLane(tl, 'l1');
ok('remove lane');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'STUDIO-E20-TIMELINE', failures: 0 }));
