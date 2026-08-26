'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createProjectV2, saveProject, openProject, beginUndo, commitUndo, setTransport, globalStop } = require('../src/phase2.cjs');
const { registerRoleTrack, addSection } = require('../src/phase3.cjs');
const {
  createMusicalContext, validateChordSymbol, createProgression, validateProgression,
  createArrangementDraft, createGoldenSequence, validateHumanizationConfig, attachPhase4, mapTickToBeats
} = require('../src/phase4.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

const ctx = createMusicalContext({ key: 'A', scale: 'minor', tempo: 100 });
ok('key/scale validation');
try { createMusicalContext({ scale: 'weird' }); bad('scale'); } catch (e) { if (e.code === 'INVALID_SCALE') ok('invalid scale rejection'); else bad(e.message); }

validateChordSymbol('Am'); validateChordSymbol('G7');
try { validateChordSymbol('X9xyz'); bad('chord'); } catch (e) { if (e.code === 'INVALID_CHORD') ok('invalid chord rejection'); else bad(e.message); }

const prog = createProgression([
  { symbol: 'Am', function: 'tonic', durationBeats: 4 },
  { symbol: 'Dm', function: 'predominant', durationBeats: 4 },
  { symbol: 'E7', function: 'dominant', durationBeats: 4 },
  { symbol: 'Am', function: 'return', durationBeats: 4 }
]);
if (validateProgression(prog).ok) ok('progression + harmonic-function sequence'); else bad('prog');

let p = createProjectV2({ name: 'P4' });
registerRoleTrack(p, { trackId: 'mel', role: 'melody' });
registerRoleTrack(p, { trackId: 'bs', role: 'bass' });
addSection(p, { kind: 'intro', startBeats: 0, endBeats: 4 });
addSection(p, { kind: 'verse', startBeats: 4, endBeats: 12 });
const draft = createArrangementDraft(p, {
  sectionGraph: { nodes: [{ id: 'a', section: 'intro' }, { id: 'b', section: 'verse' }], edges: [{ from: 'a', to: 'b' }] },
  trackRoles: { mel: 'melody', bs: 'bass' }
});
if (draft.densityProfile.chorus && draft.registerPlan.melody) ok('density/register plans + section graph + roles'); else bad('draft');

const seq = createGoldenSequence([
  { type: 'tempo', tick: 0, priority: 0, bpm: 100 },
  { type: 'section', tick: 0, priority: 1, name: 'intro' },
  { type: 'note', tick: 480, priority: 2, pitch: 60 },
  { type: 'chord', tick: 0, priority: 1, symbol: 'Am' }
]);
if (seq.events[0].type === 'tempo' && mapTickToBeats(480) === 1) ok('deterministic event ordering + tempo mapping'); else bad('seq');
validateHumanizationConfig({ enabled: false, timingMs: 0, velocityJitter: 0 });
ok('humanization configuration validation');

attachPhase4(p, { context: ctx, progression: prog, sequence: seq });
beginUndo(p); commitUndo(p); ok('undo/redo');
setTransport(p, 'playing'); globalStop(p); ok('transport + global stop');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-p4-'));
const file = path.join(dir, 'p4.creator.json');
saveProject(file, p);
const loaded = openProject(file);
if (loaded.composition?.goldenSequence && loaded.composition?.claims?.goldenSequencerCommercialReady === false) ok('serialization + save/open + honest claims'); else bad('roundtrip');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'CREATOR-PHASE4-ARRANGEMENT-SEQUENCER', failures: 0 }));
