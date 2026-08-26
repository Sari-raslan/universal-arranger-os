#!/usr/bin/env node
// UAOS Program Tree V2 — apply the confirmed reclassification to TASKS.json.
//
// All 1284 currently-DONE tasks are confirmed (full census) marker-only stubs.
// Rather than flat-flipping all 1284 to the same ready state (which would ignore
// the DAG's own CONTRACT -> IMPLEMENT -> TEST -> EVIDENCE sequencing and let the
// dispatcher pick up e.g. a TEST-phase task before its CONTRACT/IMPLEMENT
// predecessors have been genuinely redone), this recomputes true readiness:
//   - a reopened task becomes RETRY_READY only if it has zero predecessor edges
//     (nothing it depends on)
//   - a reopened task with one or more predecessor edges becomes
//     BLOCKED_BY_DEPENDENCY, since none of those predecessors are genuinely
//     done anymore either. It will naturally unblock once its real predecessor
//     is implemented and passes real dispatch.
// Also relabels the one mislabeled task found in DAG validation
// (BLOCKED_BY_DEPENDENCY with zero dependency edges but a real FORMAT_GATE)
// to BLOCKED_BY_FORMAT.
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v2-apply-reclassification.mjs <rundir>'); process.exit(1); }

const tasksPath = path.join(TREE, 'TASKS.json');
const tasksDoc = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));

const depsDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'DEPENDENCIES.json'), 'utf8'));
const reverseAdj = new Map();
for (const e of depsDoc.edges) {
  if (!byId.has(e.from) || !byId.has(e.to)) continue;
  if (!reverseAdj.has(e.to)) reverseAdj.set(e.to, []);
  reverseAdj.get(e.to).push(e.from);
}

const now = new Date().toISOString();
const reopenedToReady = [];
const reopenedToBlocked = [];

for (const t of tasks) {
  if (t.state !== 'DONE') continue;
  const preds = reverseAdj.get(t.id) || [];
  if (preds.length === 0) {
    t.state = 'RETRY_READY';
    t.blockedReason = null;
    reopenedToReady.push(t.id);
  } else {
    t.state = 'BLOCKED_BY_DEPENDENCY';
    t.blockedReason = `REOPENED_MARKER_ONLY_STUB awaiting genuine implementation of ${preds.length} predecessor task(s)`;
    reopenedToBlocked.push({ id: t.id, predecessorCount: preds.length, predecessors: preds });
  }
  t.updatedAt = now;
}

// Finding 2: mislabeled state correction.
const mislabeled = byId.get('TASK-06-00725-REAL_TIME_DSP_CONTRACT');
let mislabeledApplied = false;
if (mislabeled && mislabeled.state === 'BLOCKED_BY_DEPENDENCY') {
  mislabeled.state = 'BLOCKED_BY_FORMAT';
  mislabeled.updatedAt = now;
  mislabeledApplied = true;
}

tasksDoc.generatedAt = tasksDoc.generatedAt; // unchanged provenance of original generation
fs.writeFileSync(tasksPath, JSON.stringify(tasksDoc, null, 2));

const stateCountsAfter = {};
for (const t of tasks) stateCountsAfter[t.state] = (stateCountsAfter[t.state] || 0) + 1;

const result = {
  appliedAt: now,
  reopenedTotal: reopenedToReady.length + reopenedToBlocked.length,
  reopenedToRetryReadyCount: reopenedToReady.length,
  reopenedToRetryReadyIds: reopenedToReady,
  reopenedToBlockedByDependencyCount: reopenedToBlocked.length,
  reopenedToBlockedByDependencySample: reopenedToBlocked.slice(0, 30),
  mislabeledCorrectionApplied: mislabeledApplied,
  stateCountsAfter,
};
fs.writeFileSync(path.join(runDir, 'UNBLOCKED-TASKS.json'), JSON.stringify(result, null, 2));

console.log('applied. retryReady=', reopenedToReady.length, 'blockedByDependency=', reopenedToBlocked.length, 'mislabeledFixed=', mislabeledApplied);
console.log('stateCountsAfter=', JSON.stringify(stateCountsAfter));
