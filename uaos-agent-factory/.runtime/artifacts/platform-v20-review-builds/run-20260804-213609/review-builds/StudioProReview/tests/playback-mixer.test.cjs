'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createTransport, setTransportState, seek, setLoop, globalStop,
  createScheduler, scheduleClip, cancelScheduler, rescheduleAfterSeek,
  createMixer, addChannel, setGainPan, setMuteSolo, addRoute, meterSnapshot, serializeMixer, attachPlayback, timeline
} = require('../src/playback-mixer.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

let t = createTransport();
setTransportState(t, 'playing');
setTransportState(t, 'paused');
setTransportState(t, 'playing');
globalStop(t);
ok('transport transitions + global stop');
try { setTransportState(t, 'paused'); bad('inv'); } catch (e) { if (e.code === 'INVALID_TRANSPORT') ok('invalid transition rejection'); else bad(e.message); }
seek(t, 8); setLoop(t, { enabled: true, startBeats: 0, endBeats: 16 }); ok('seek + loop');

const sched = createScheduler({ lookAheadBeats: 8 });
scheduleClip(sched, { clipId: 'c1', startBeats: 0, kind: 'audio' });
scheduleClip(sched, { clipId: 'c2', startBeats: 2, kind: 'midi' });
if (sched.queue[0].atBeats <= sched.queue[1].atBeats) ok('event ordering'); else bad('order');
cancelScheduler(sched);
if (sched.queue.length === 0) ok('scheduler cancellation'); else bad('cancel');
rescheduleAfterSeek(sched, [{ clipId: 'c1', startBeats: 4, kind: 'audio' }], 0);
if (sched.queue.length === 1) ok('seek rescheduling'); else bad('resched');

const mix = createMixer();
addChannel(mix, { channelId: 'ch1', kind: 'track', trackId: 't1' });
addChannel(mix, { channelId: 'bus1', kind: 'bus' });
setGainPan(mix, 'ch1', { gainDb: -6, pan: -0.2 });
setMuteSolo(mix, 'ch1', { mute: false, solo: true });
addRoute(mix, 'ch1', 'master');
ok('mixer routing/gain/pan/mute/solo/master');
try { addRoute(mix, 'ch1', 'missing'); bad('route'); } catch (e) { if (e.code === 'INVALID_ROUTE') ok('invalid route rejection'); else bad(e.message); }

const meters = meterSnapshot(mix, { ch1: { peak: 1.2, rms: 0.8 } });
if (meters[0].clipping) ok('clipping detection'); else bad('clip');
const ser = serializeMixer(mix);
if (ser.schemaVersion === 'uaos.studio.mixer/v1') ok('state serialization'); else bad('ser');

let project = timeline.createProject({ name: 'E30' });
attachPlayback(project);
timeline.registerTrack(project, { trackId: 't1', kind: 'audio', name: 'A' });
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-e30-'));
const file = path.join(dir, 'e30.studio.json');
timeline.saveProject(file, project);
const opened = timeline.openProject(file);
if (opened.project.mixer && opened.project.transport) ok('save/open round-trip'); else bad('roundtrip');

const v0 = { schemaVersion: 'uaos.studio.project/v0', projectId: 'legacy', name: 'L', createdAt: new Date().toISOString(), tracks: [] };
if (timeline.migrateProject(v0).schemaVersion === 'uaos.studio.project/v1') ok('migration'); else bad('migration');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'STUDIO-E30-PLAYBACK-MIXER', failures: 0 }));
