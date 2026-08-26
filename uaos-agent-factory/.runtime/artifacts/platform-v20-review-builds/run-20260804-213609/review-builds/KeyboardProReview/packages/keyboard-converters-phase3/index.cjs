'use strict';
/**
 * Keyboard Converters Phase3 — validation, resume, recovery
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const p2 = require('../keyboard-converters-phase2/index.cjs');

const STATES = ['prepared', 'running', 'paused', 'cancelled', 'failed', 'completed'];

function journalPath(jobDir) { return path.join(jobDir, 'job.journal.json'); }

function atomicWrite(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + `.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function createPersistentJob(input, jobDir, { mode = 'convert' } = {}) {
  fs.mkdirSync(jobDir, { recursive: true });
  const job = p2.createJob({ input, outputDir: path.join(jobDir, 'out'), mode });
  const record = {
    schemaVersion: 'uaos.converter.job-journal/v18',
    ...job,
    status: 'prepared',
    resumeToken: crypto.randomUUID(),
    sourceSnapshotHash: job.inputHash,
    targetStagingHash: null,
    progress: { percent: 0, checkpoint: 'prepared' },
    warnings: [],
    errors: [],
    audit: [{ at: new Date().toISOString(), event: 'created' }],
    locks: { job: false, outputs: [] }
  };
  persist(jobDir, record);
  return record;
}

function persist(jobDir, record) {
  atomicWrite(journalPath(jobDir), record);
  return record;
}

function loadJournal(jobDir) {
  const jp = journalPath(jobDir);
  if (!fs.existsSync(jp)) throw Object.assign(new Error('NO_JOURNAL'), { code: 'NO_JOURNAL' });
  let raw = fs.readFileSync(jp, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  let rec;
  try { rec = JSON.parse(raw); } catch {
    throw Object.assign(new Error('CORRUPTED_JOURNAL'), { code: 'CORRUPTED_JOURNAL' });
  }
  if (!rec.resumeToken || !STATES.includes(rec.status) && rec.status !== 'prepared') {
    // allow prepared
  }
  if (!rec.schemaVersion) throw Object.assign(new Error('CORRUPTED_JOURNAL'), { code: 'CORRUPTED_JOURNAL' });
  return rec;
}

function transition(rec, next) {
  const allowed = {
    prepared: ['running', 'cancelled'],
    running: ['paused', 'completed', 'failed', 'cancelled'],
    paused: ['running', 'cancelled'],
    cancelled: [],
    failed: ['running'],
    completed: []
  };
  if (!(allowed[rec.status] || []).includes(next)) throw Object.assign(new Error(`BAD_STATE:${rec.status}->${next}`), { code: 'BAD_STATE' });
  rec.status = next;
  rec.audit.push({ at: new Date().toISOString(), event: `to:${next}` });
  return rec;
}

function acquireJobLock(rec) {
  if (rec.locks.job) throw Object.assign(new Error('JOB_LOCKED'), { code: 'JOB_LOCKED' });
  rec.locks.job = true;
  return rec;
}

function releaseJobLock(rec) { rec.locks.job = false; return rec; }

function runWithCheckpoints(jobDir, { crashAfterStage = null } = {}) {
  let rec = loadJournal(jobDir);
  acquireJobLock(rec);
  if (rec.status !== 'running') transition(rec, 'running');
  rec.progress = { percent: 10, checkpoint: 'pre-validate' };
  persist(jobDir, rec);

  const staged = p2.stageConvert({ ...rec, status: 'queued', mode: rec.mode || 'convert', inputSnapshot: rec.inputSnapshot, outputDir: rec.outputDir, stagingDir: rec.stagingDir || path.join(rec.outputDir, '.staging'), warnings: [], errors: [] });
  rec.warnings = staged.warnings || [];
  rec.errors = staged.errors || [];
  if (staged.status === 'failed') {
    transition(rec, 'failed');
    releaseJobLock(rec);
    persist(jobDir, rec);
    return rec;
  }
  rec.targetStagingHash = crypto.createHash('sha256').update(JSON.stringify(fs.readdirSync(staged.stagingDir || rec.stagingDir || []))).digest('hex');
  rec.progress = { percent: 60, checkpoint: 'staged' };
  persist(jobDir, rec);
  if (crashAfterStage === 'staged') {
    // simulate crash while locked/running
    rec.audit.push({ at: new Date().toISOString(), event: 'simulated-crash' });
    persist(jobDir, rec);
    return rec;
  }

  // pre-commit verification
  if (!fs.existsSync(staged.stagingDir)) {
    transition(rec, 'failed');
    rec.errors.push({ code: 'MISSING_STAGING' });
    releaseJobLock(rec);
    persist(jobDir, rec);
    return rec;
  }
  Object.assign(rec, { stagingDir: staged.stagingDir, status: 'running' });
  const committed = p2.commitStaged({ ...staged, status: 'staged' });
  rec.receipt = committed.receipt;
  rec.receiptHash = crypto.createHash('sha256').update(JSON.stringify(committed.receipt)).digest('hex');
  // post-commit verification in output only
  if (!committed.receipt) {
    transition(rec, 'failed');
  } else {
    transition(rec, 'completed');
    rec.progress = { percent: 100, checkpoint: 'completed' };
  }
  releaseJobLock(rec);
  persist(jobDir, rec);
  return rec;
}

function pauseJob(jobDir) {
  const rec = loadJournal(jobDir);
  if (rec.status === 'running') transition(rec, 'paused');
  releaseJobLock(rec);
  persist(jobDir, rec);
  return rec;
}

function resumeJob(jobDir, token) {
  const rec = loadJournal(jobDir);
  if (token !== rec.resumeToken) throw Object.assign(new Error('BAD_RESUME_TOKEN'), { code: 'BAD_RESUME_TOKEN' });
  if (rec.status === 'paused' || (rec.status === 'running' && rec.progress?.checkpoint === 'staged')) {
    if (rec.status === 'paused') transition(rec, 'running');
    persist(jobDir, rec);
    return runWithCheckpoints(jobDir);
  }
  if (rec.status === 'failed') {
    transition(rec, 'running');
    persist(jobDir, rec);
    return runWithCheckpoints(jobDir);
  }
  return rec;
}

function cancelJob(jobDir) {
  const rec = loadJournal(jobDir);
  if (['completed'].includes(rec.status)) throw Object.assign(new Error('TOO_LATE'), { code: 'TOO_LATE' });
  rec.status = 'cancelled';
  rec.audit.push({ at: new Date().toISOString(), event: 'cancelled' });
  releaseJobLock(rec);
  persist(jobDir, rec);
  return rec;
}

function recoverStale(jobDir, { maxAgeMs = 1 } = {}) {
  const rec = loadJournal(jobDir);
  if (rec.status === 'running' && rec.locks.job) {
    rec.audit.push({ at: new Date().toISOString(), event: 'stale-recovery' });
    rec.locks.job = false;
    rec.status = 'paused';
    persist(jobDir, rec);
    return { recovered: true, rec };
  }
  return { recovered: false, rec };
}

function idempotentRerun(jobDir) {
  const rec = loadJournal(jobDir);
  if (rec.status === 'completed' && rec.receiptHash) return { ok: true, skipped: true, rec };
  return { ok: true, skipped: false, rec: runWithCheckpoints(jobDir) };
}

function rollbackJob(jobDir) {
  const rec = loadJournal(jobDir);
  p2.rollbackOutput(rec);
  rec.audit.push({ at: new Date().toISOString(), event: 'rollback', receiptHash: rec.receiptHash });
  rec.status = 'cancelled';
  persist(jobDir, rec);
  return rec;
}

module.exports = {
  STATES,
  createPersistentJob,
  loadJournal,
  runWithCheckpoints,
  pauseJob,
  resumeJob,
  cancelJob,
  recoverStale,
  idempotentRerun,
  rollbackJob,
  persist
};
