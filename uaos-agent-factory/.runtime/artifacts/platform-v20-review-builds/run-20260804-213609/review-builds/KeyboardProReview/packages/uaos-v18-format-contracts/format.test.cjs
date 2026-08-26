'use strict';
const { detectFormat, inspectBuffer, enforceWrite, FAMILIES } = require('./index.cjs');
let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

const midi = Buffer.from([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6]);
const d = detectFormat(midi, { filename: 'a.mid' });
if (d.formatId === 'midi') ok('known fixture detection'); else bad('midi');
if (detectFormat(Buffer.from('zzzz'), { filename: 'x.bin' }).error === 'UNKNOWN_FORMAT') ok('unknown format'); else bad('unk');
if (inspectBuffer(midi, { corrupted: true }).diagnostics.includes('corruption-reported')) ok('corrupted input'); else bad('corr');
if (inspectBuffer(midi, { expectTruncated: true }).diagnostics.includes('truncated')) ok('truncated input'); else bad('trunc');
const big = Buffer.alloc(6 * 1024 * 1024, 1);
if (detectFormat(big).error === 'OVERSIZED') ok('oversized rejection'); else bad('size');
if (inspectBuffer(midi, { versionMismatch: true }).error === 'VERSION_MISMATCH') ok('version mismatch'); else bad('ver');
if (inspectBuffer(midi, { nestedDepth: 99 }).error === 'NESTED_DEPTH_LIMIT') ok('nested-depth limit'); else bad('nest');
const a = inspectBuffer(midi); const b = inspectBuffer(midi);
if (a.deterministicId === b.deterministicId) ok('deterministic diagnostics id'); else bad('det');
if (!enforceWrite('korg.sty').allowed && FAMILIES['korg.sty'].status === 'INSPECT_ONLY') ok('capability enforcement proprietary'); else bad('cap');
if (enforceWrite('uaos.project').allowed) ok('uaos write allowed'); else bad('uaos');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'KEYBOARD-V18-FORMAT-CONTRACTS', failures: 0 }));
