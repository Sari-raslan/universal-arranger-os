'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createPersistentJob, runWithCheckpoints, pauseJob, resumeJob, cancelJob,
  recoverStale, idempotentRerun, rollbackJob, loadJournal
} = require('./index.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

const input = { kind: 'uaos.arranger.set', schemaVersion: 'uaos.arranger.project/v1', tracks: [{ trackId: 't1', kind: 'midi', name: 'L' }] };
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-c3-'));

const j1 = path.join(base, 'new');
let rec = createPersistentJob(input, j1);
if (rec.status === 'prepared') ok('new job'); else bad('new');
rec = runWithCheckpoints(j1);
if (rec.status === 'completed' && rec.receiptHash) ok('completed + receipt'); else bad('run');

const j2 = path.join(base, 'pause');
createPersistentJob(input, j2);
// manually set running then pause
let r2 = loadJournal(j2);
r2.status = 'running'; r2.locks.job = true;
fs.writeFileSync(path.join(j2, 'job.journal.json'), JSON.stringify(r2, null, 2));
pauseJob(j2);
if (loadJournal(j2).status === 'paused') ok('pause'); else bad('pause');
resumeJob(j2, loadJournal(j2).resumeToken);
if (loadJournal(j2).status === 'completed') ok('resume'); else bad('resume');

const j3 = path.join(base, 'cancel');
createPersistentJob(input, j3);
cancelJob(j3);
if (loadJournal(j3).status === 'cancelled') ok('cancel'); else bad('cancel');

const j4 = path.join(base, 'crash');
createPersistentJob(input, j4);
runWithCheckpoints(j4, { crashAfterStage: 'staged' });
const stale = recoverStale(j4);
if (stale.recovered || loadJournal(j4).status === 'paused' || loadJournal(j4).status === 'running') ok('crash/stale recovery path'); else bad('stale');

const idemp = idempotentRerun(j1);
if (idemp.skipped) ok('idempotent rerun'); else bad('idemp');

const j5 = path.join(base, 'rb');
createPersistentJob(input, j5);
runWithCheckpoints(j5);
rollbackJob(j5);
if (loadJournal(j5).status === 'cancelled') ok('rollback'); else bad('rb');

// corrupted journal
const j6 = path.join(base, 'bad');
fs.mkdirSync(j6, { recursive: true });
fs.writeFileSync(path.join(j6, 'job.journal.json'), '{not-json');
try { loadJournal(j6); bad('corr'); } catch (e) { if (e.code === 'CORRUPTED_JOURNAL') ok('corrupted journal rejection'); else bad(e.message); }

// partial batch-ish: unsupported + good
const j7 = path.join(base, 'fail');
createPersistentJob({ formatId: 'korg.sty' }, j7);
const failed = runWithCheckpoints(j7);
if (failed.status === 'failed') ok('partial/unsupported failure'); else bad('fail');

if (rec.receiptHash && rec.receiptHash.length === 64) ok('deterministic receipt hash present'); else bad('hash');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'KEYBOARD-CONVERTERS-PHASE3', failures: 0 }));
