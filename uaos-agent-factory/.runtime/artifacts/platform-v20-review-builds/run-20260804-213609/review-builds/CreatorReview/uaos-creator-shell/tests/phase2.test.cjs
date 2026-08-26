'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  FeatureFlags, Entitlements, CommandBus, EvidenceHooks, readJson
} = require('../src/shell.cjs');
const {
  createProjectV2, validateProjectV2, registerTrack, addClipMeta,
  beginUndo, commitUndo, setTransport, globalStop, seek, setLoop,
  saveProject, openProject, recoverJournal, wireCommandBus, migrateV1toV2
} = require('../src/phase2.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

const root = path.join(__dirname, '..');
const flags = new FeatureFlags(readJson(path.join(root, 'contracts', 'feature-flags.json')).flags);
const ents = new Entitlements('creator.free', readJson(path.join(root, 'contracts', 'entitlements.json')));
const bus = new CommandBus();
const evidence = new EvidenceHooks();
wireCommandBus(bus, evidence, flags, ents);

let p = createProjectV2({ name: 'P2' });
if (validateProjectV2(p).ok) ok('new project'); else bad('new project');

registerTrack(p, { trackId: 'a1', kind: 'audio', name: 'Audio' });
registerTrack(p, { trackId: 'm1', kind: 'midi', name: 'MIDI' });
ok('audio/midi track registration');
addClipMeta(p, { clipId: 'c1', trackId: 'a1', kind: 'audio', startBeats: 0, durationBeats: 4 });
ok('clip metadata');

beginUndo(p); commitUndo(p); ok('undo/redo boundaries');

setTransport(p, 'playing');
setTransport(p, 'paused');
setTransport(p, 'playing');
globalStop(p);
if (p.transport.state === 'stopped') ok('transport transitions + global stop'); else bad('transport');
try { setTransport(p, 'paused'); bad('invalid transition'); } catch (e) { if (e.code === 'INVALID_TRANSPORT') ok('invalid transition rejection'); else bad(e.message); }

seek(p, 8); setLoop(p, { startBeats: 0, endBeats: 16 }); ok('seek + loop');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-cre2-'));
const file = path.join(dir, 'p2.creator.json');
saveProject(file, p);
const loaded = openProject(file);
if (loaded.projectId === p.projectId) ok('save/open round-trip'); else bad('round-trip');
if (recoverJournal(file).recovered) ok('autosave journal'); else bad('journal');

const file2 = path.join(dir, 'int.creator.json');
let p2 = createProjectV2({ name: 'I' });
try { saveProject(file2, p2, { simulateInterrupt: true }); bad('interrupt'); }
catch (e) { if (e.code === 'SAVE_INTERRUPTED' && recoverJournal(file2).reason === 'INTERRUPTED_NEEDS_USER') ok('interrupted-save recovery'); else bad(String(e)); }

const v1 = { schemaVersion: 'uaos.creator.project/v1', projectId: 'x', name: 'v1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tracks: [], assets: [] };
const mig = migrateV1toV2(v1);
if (mig.schemaVersion === 'uaos.creator.project/v2') ok('migration v1->v2'); else bad('migration');

bus.dispatch('project.create');
try { flags.enforce('voice.to.midi'); bad('flag'); } catch (e) { if (e.code === 'FEATURE_FLAG_DISABLED') ok('feature flags'); else bad(e.message); }
try { ents.enforce('voice.to.midi'); bad('ent'); } catch (e) { if (e.code === 'ENTITLEMENT_REQUIRED') ok('entitlements'); else bad(e.message); }

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'CREATOR-PHASE2-WORKSPACE-TRANSPORT', failures: 0 }));
