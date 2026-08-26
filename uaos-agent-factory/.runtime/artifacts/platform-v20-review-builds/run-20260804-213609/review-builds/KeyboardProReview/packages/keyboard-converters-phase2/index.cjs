'use strict';
/**
 * Keyboard Converters Phase2 — internal pipeline + preview
 * Builds on V16 safe core. No proprietary writers.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const v16 = require('../keyboard-converters-safe-core/index.cjs');

const JOB_SCHEMA = {
  schemaVersion: 'uaos.converter.job/v17',
  required: ['jobId', 'status', 'inputSnapshot', 'outputDir', 'mode'],
  statuses: ['queued', 'running', 'dry_run', 'staged', 'committed', 'cancelled', 'failed', 'rolled_back']
};

function createJob({ input, outputDir, mode = 'dry_run' } = {}) {
  if (!outputDir) throw Object.assign(new Error('OUTPUT_DIR_REQUIRED'), { code: 'OUTPUT_DIR_REQUIRED' });
  const snapshot = JSON.parse(JSON.stringify(input || {}));
  return {
    schemaVersion: JOB_SCHEMA.schemaVersion,
    jobId: crypto.randomUUID(),
    status: 'queued',
    mode,
    inputSnapshot: snapshot,
    inputHash: crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),
    outputDir,
    stagingDir: path.join(outputDir, '.staging'),
    createdAt: new Date().toISOString(),
    warnings: [],
    errors: [],
    receipt: null
  };
}

class BatchQueue {
  constructor() { this.jobs = []; }
  enqueue(job) { this.jobs.push(job); return job; }
  list() { return [...this.jobs]; }
}

function stageConvert(job) {
  if (job.status === 'cancelled') return job;
  fs.mkdirSync(job.stagingDir, { recursive: true });
  job.status = 'running';
  const insp = v16.inspectInput(job.inputSnapshot);
  if (!insp.supported) {
    job.status = 'failed';
    job.errors = insp.errors;
    const report = { ok: false, errors: insp.errors, unsupportedFeatureReport: insp.errors };
    v16.atomicWrite(path.join(job.stagingDir, 'validation-summary.json'), report);
    return job;
  }
  if (job.mode === 'dry_run') {
    const plan = v16.buildMappingPlan(insp);
    const dry = v16.dryRunGraph(plan);
    v16.atomicWrite(path.join(job.stagingDir, 'dryrun.graph.json'), dry);
    v16.atomicWrite(path.join(job.stagingDir, 'before-after.preview.json'), {
      before: { formatId: insp.formatId, trackCount: insp.trackCount },
      after: { formatId: plan.targetFormat, projectedTracks: insp.trackCount }
    });
    job.status = 'dry_run';
    job.warnings = insp.warnings || [];
    return job;
  }
  const report = v16.convertInternal(job.inputSnapshot, job.stagingDir);
  if (!report.ok) {
    job.status = 'failed';
    job.errors = report.errors;
    return job;
  }
  job.status = 'staged';
  job.warnings = report.warnings || [];
  return job;
}

function cancelBeforeCommit(job) {
  if (['committed', 'rolled_back'].includes(job.status)) throw Object.assign(new Error('TOO_LATE'), { code: 'TOO_LATE' });
  job.status = 'cancelled';
  return job;
}

function commitStaged(job) {
  if (job.status !== 'staged') throw Object.assign(new Error('NOT_STAGED'), { code: 'NOT_STAGED' });
  fs.mkdirSync(job.outputDir, { recursive: true });
  for (const f of fs.readdirSync(job.stagingDir)) {
    const src = path.join(job.stagingDir, f);
    const destName = deterministicName(job.jobId, f);
    const dest = path.join(job.outputDir, destName);
    if (fs.existsSync(dest)) throw Object.assign(new Error('COLLISION'), { code: 'COLLISION', dest });
    fs.copyFileSync(src, dest);
  }
  const files = fs.readdirSync(job.outputDir).filter((n) => !n.startsWith('.'));
  const shaManifest = {};
  for (const f of files) {
    shaManifest[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(job.outputDir, f))).digest('hex');
  }
  job.receipt = {
    schemaVersion: 'uaos.converter.receipt/v17',
    jobId: job.jobId,
    at: new Date().toISOString(),
    sha256Manifest: shaManifest,
    inputHash: job.inputHash
  };
  v16.atomicWrite(path.join(job.outputDir, `receipt-${job.jobId}.json`), job.receipt);
  job.status = 'committed';
  return job;
}

function rollbackOutput(job) {
  if (!fs.existsSync(job.outputDir)) { job.status = 'rolled_back'; return job; }
  for (const f of fs.readdirSync(job.outputDir)) {
    fs.rmSync(path.join(job.outputDir, f), { force: true, recursive: true });
  }
  if (fs.existsSync(job.stagingDir)) fs.rmSync(job.stagingDir, { recursive: true, force: true });
  job.status = 'rolled_back';
  return job;
}

function deterministicName(jobId, file) {
  const short = jobId.slice(0, 8);
  return `${short}-${file}`;
}

function runBatch(inputs, baseOut) {
  const q = new BatchQueue();
  const results = [];
  inputs.forEach((input, i) => {
    const job = createJob({ input, outputDir: path.join(baseOut, `job-${i}`), mode: 'convert' });
    q.enqueue(job);
    try {
      stageConvert(job);
      if (job.status === 'staged') commitStaged(job);
    } catch (e) {
      job.status = 'failed';
      job.errors = [{ code: e.code || 'ERROR', message: e.message }];
    }
    results.push({ jobId: job.jobId, status: job.status, errors: job.errors });
  });
  return {
    ok: results.every((r) => r.status === 'committed'),
    partialFailure: results.some((r) => r.status === 'failed') && results.some((r) => r.status === 'committed'),
    results
  };
}

module.exports = {
  JOB_SCHEMA,
  createJob,
  BatchQueue,
  stageConvert,
  cancelBeforeCommit,
  commitStaged,
  rollbackOutput,
  runBatch,
  deterministicName,
  FORMAT_REGISTRY: v16.FORMAT_REGISTRY,
  CAPABILITIES: v16.CAPABILITIES,
  v16
};
