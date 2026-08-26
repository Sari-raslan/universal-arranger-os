'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  readJson, FeatureFlags, Entitlements, CommandBus, EvidenceHooks,
  createProject, validateProject, saveProject, openProject,
  AudioMidiServiceInterface, SamplerAdapterInterface, GlobalPlayerMixerInterface
} = require('../src/shell.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

const root = path.join(__dirname, '..');
const manifest = readJson(path.join(root, 'manifest', 'product.manifest.json'));
if (manifest.schemaVersion !== 'uaos.creator.manifest/v1') bad('manifest schema'); else ok('manifest schema');
if (manifest.claims.voiceToMidi !== false) bad('false claim voiceToMidi'); else ok('no false advanced claims');

const projectSchema = readJson(path.join(root, 'contracts', 'project.schema.json'));
if (projectSchema.schemaVersion !== 'uaos.creator.project/v1') bad('project schema'); else ok('project schema');

const caps = readJson(path.join(root, 'contracts', 'capability-registry.json'));
if (caps.capabilities['voice.to.midi'].status !== 'NOT_IMPLEMENTED') bad('voice capability'); else ok('capability registry honesty');

const flagsDoc = readJson(path.join(root, 'contracts', 'feature-flags.json'));
const flags = new FeatureFlags(flagsDoc.flags);
if (!flags.enabled('shell.enabled')) bad('shell flag'); else ok('feature flag shell');
try { flags.enforce('voice.to.midi'); bad('voice flag should throw'); } catch (e) { if (e.code === 'FEATURE_FLAG_DISABLED') ok('feature flag enforcement'); else bad(e.message); }

const ents = readJson(path.join(root, 'contracts', 'entitlements.json'));
const free = new Entitlements('creator.free', ents);
if (!free.has('project.save')) bad('free entitlement'); else ok('entitlement free save');
try { free.enforce('voice.to.midi'); bad('should block voice'); } catch (e) { if (e.code === 'ENTITLEMENT_REQUIRED') ok('entitlement enforcement'); else bad(e.message); }

const bus = new CommandBus();
const evidence = new EvidenceHooks();
bus.register('project.create', () => createProject({ name: 'T' }));
bus.register('evidence.ping', () => evidence.emit('ping'));
const p = bus.dispatch('project.create');
if (validateProject(p).ok) ok('command routing create'); else bad('create project');
bus.dispatch('evidence.ping');
if (evidence.events.length === 1) ok('evidence hooks'); else bad('evidence');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-creator-'));
const file = path.join(dir, 'demo.creator.json');
saveProject(file, p);
const loaded = openProject(file);
if (loaded.projectId === p.projectId) ok('project round-trip'); else bad('round-trip');

const badProj = { schemaVersion: 'wrong', projectId: 'x', tracks: [], assets: [] };
if (!validateProject(badProj).ok) ok('invalid project rejection'); else bad('should reject');

if (!AudioMidiServiceInterface.implemented && !SamplerAdapterInterface.implemented && !GlobalPlayerMixerInterface.implemented) {
  ok('interface contracts present as interfaces-only');
} else bad('interfaces falsely implemented');

try { bus.dispatch('does.not.exist'); bad('unknown cmd'); } catch (e) { if (e.code === 'UNKNOWN_COMMAND') ok('unknown command'); else bad(e.message); }

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'CREATOR-SHELL-FOUNDATION', failures: 0 }));
