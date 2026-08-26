'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  CAPABILITIES, FORMAT_REGISTRY, inspectInput, convertInternal, roundTripInternal, buildMappingPlan, dryRunGraph
} = require('./index.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

if (CAPABILITIES['write.korg.proprietary'] === false && CAPABILITIES['usb.hardware'] === false && CAPABILITIES['sysex'] === false) ok('banned capabilities false'); else bad('banned caps');
if (FORMAT_REGISTRY['korg.sty'].supported === false) ok('unsupported korg formats'); else bad('korg');

const input = {
  kind: 'uaos.arranger.set',
  schemaVersion: 'uaos.arranger.project/v1',
  tracks: [{ trackId: 't1', kind: 'midi', name: 'Lead' }, { trackId: 't2', kind: 'midi', name: 'Bass' }]
};
const insp = inspectInput(input);
if (insp.supported) ok('input inspection + format detect'); else bad('inspect');

const plan = buildMappingPlan(insp, 'uaos.project/v1');
const dry = dryRunGraph(plan);
if (dry.ok && dry.proprietaryWriters === false) ok('dry-run conversion graph'); else bad('dryrun');

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-conv-out-'));
const report = convertInternal(input, out);
if (report.ok && fs.existsSync(path.join(out, 'converted.project.json'))) ok('internal conversion to new dir'); else bad('convert');
if (fs.existsSync(path.join(out, 'conversion-report.json'))) ok('warning/error reporting file'); else bad('report');

const rt = roundTripInternal(input);
if (rt.ok) ok('round-trip internal'); else bad('roundtrip');

const rejected = convertInternal({ formatId: 'korg.sty', tracks: [] }, fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-rej-')));
if (!rejected.ok && rejected.errors?.[0]?.code === 'UNSUPPORTED_FORMAT') ok('unsupported-format rejection'); else bad('reject');

const syx = convertInternal({ formatId: 'sysex.dump' }, fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-syx-')));
if (!syx.ok) ok('sysex rejected'); else bad('sysex');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'KEYBOARD-CONVERTERS-SAFE-CORE', failures: 0, tests: 8 }));
