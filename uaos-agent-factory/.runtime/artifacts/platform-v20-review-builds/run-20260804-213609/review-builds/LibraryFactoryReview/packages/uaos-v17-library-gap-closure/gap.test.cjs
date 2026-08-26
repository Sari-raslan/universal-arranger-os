'use strict';
const {
  GAP_CLASSIFICATION, deterministicManifest, validateJournal, recoverStaleLock,
  diagnoseMissingSamples, verifyRollback, closableGaps, remainingOwnerOrContentGaps
} = require('./index.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

if (GAP_CLASSIFICATION.length >= 5) ok('gap classification present'); else bad('gaps');
const tech = closableGaps();
if (tech.every((g) => g.class === 'TECHNICAL_SAFE_TO_CLOSE')) ok('technical gaps identified'); else bad('tech');
const rem = remainingOwnerOrContentGaps();
if (rem.some((g) => g.class === 'COMMERCIAL_POLICY_REQUIRED')) ok('commercial gaps remain owner/policy'); else bad('commercial');

const m1 = deterministicManifest([{ path: 'b.wav', size: 2 }, { path: 'a.wav', size: 1 }]);
const m2 = deterministicManifest([{ path: 'a.wav', size: 1 }, { path: 'b.wav', size: 2 }]);
if (m1.sha256 === m2.sha256) ok('deterministic manifest'); else bad('manifest');

if (validateJournal({ projectId: 'p', at: new Date().toISOString(), interrupted: false }).ok) ok('journal validation'); else bad('journal');
const stale = recoverStaleLock({ owner: 'x', acquiredAt: new Date(Date.now() - 120000).toISOString() }, { ttlMs: 60000 });
if (stale.recovered) ok('stale lock recovery'); else bad('lock');

const diag = diagnoseMissingSamples([{ id: 's1', path: null, missing: true }, { id: 's2', path: 'ok.wav', exists: true }]);
if (diag.missingCount === 1) ok('missing sample diagnostics'); else bad('samples');

const state = { v: 1 };
if (verifyRollback(state, { ...state }).ok) ok('rollback verification'); else bad('rollback');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'LIBRARY-V17-GAP-CLOSURE', failures: 0, technicalClosed: tech.length, remainingOwnerGaps: rem.length }));
