'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  createJob, stageConvert, cancelBeforeCommit, commitStaged, rollbackOutput, runBatch, JOB_SCHEMA, FORMAT_REGISTRY
} = require('./index.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

const input = { kind: 'uaos.arranger.set', schemaVersion: 'uaos.arranger.project/v1', tracks: [{ trackId: 't1', kind: 'midi', name: 'Lead' }] };
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-conv2-'));

let job = createJob({ input, outputDir: path.join(base, 'j1'), mode: 'dry_run' });
if (job.schemaVersion === JOB_SCHEMA.schemaVersion) ok('job model'); else bad('job');
stageConvert(job);
if (job.status === 'dry_run' && fs.existsSync(path.join(job.stagingDir, 'before-after.preview.json'))) ok('dry-run + preview'); else bad('dry');

let job2 = createJob({ input, outputDir: path.join(base, 'j2'), mode: 'convert' });
stageConvert(job2);
cancelBeforeCommit(job2);
if (job2.status === 'cancelled') ok('cancel before commit'); else bad('cancel');

let job3 = createJob({ input, outputDir: path.join(base, 'j3'), mode: 'convert' });
stageConvert(job3);
commitStaged(job3);
if (job3.status === 'committed' && job3.receipt?.sha256Manifest) ok('commit + sha256 receipt'); else bad('commit');
rollbackOutput(job3);
if (job3.status === 'rolled_back') ok('output rollback'); else bad('rollback');

const batch = runBatch([input, { formatId: 'korg.sty' }], path.join(base, 'batch'));
if (batch.partialFailure) ok('batch partial failure reporting'); else bad('batch');

let badJob = createJob({ input: { formatId: 'unknown-xyz' }, outputDir: path.join(base, 'bad'), mode: 'convert' });
stageConvert(badJob);
if (badJob.status === 'failed') ok('unknown/corrupted format rejection'); else bad('unknown');

if (FORMAT_REGISTRY['korg.sty'].supported === false) ok('proprietary remains unsupported for writing'); else bad('korg');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'KEYBOARD-CONVERTERS-PHASE2', failures: 0 }));
