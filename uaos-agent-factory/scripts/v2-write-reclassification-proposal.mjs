#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v2-write-reclassification-proposal.mjs <rundir>'); process.exit(1); }

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));

// Every DONE task was confirmed (full census) to be a CONTRACT_STUB_EXECUTED marker with no real
// implementation. Proposed target state: RETRY_READY (re-enter the pipeline for genuine
// implementation) rather than DISCOVERED, since contracts/tests/acceptance criteria already exist
// and only real implementation work is missing.
const doneTasks = tasks.filter(t => t.state === 'DONE');

const byDomain = {};
for (const t of doneTasks) byDomain[t.domain] = (byDomain[t.domain] || 0) + 1;

const rc1CriticalAffected = doneTasks.filter(t => t.rc1Critical).length;

// The one mislabeled task found during DAG validation: BLOCKED_BY_DEPENDENCY with zero
// dependency edges but a real FORMAT_GATE -> should be relabeled BLOCKED_BY_FORMAT, not unblocked.
const mislabeled = [{
  id: 'TASK-06-00725-REAL_TIME_DSP_CONTRACT',
  currentState: 'BLOCKED_BY_DEPENDENCY',
  proposedState: 'BLOCKED_BY_FORMAT',
  reason: 'Zero dependency edges reference this task; its gate field is already FORMAT_GATE with blockedReason FUTURE_TECHNICAL_PHASE_REQUIRED REAL_TIME_DSP_NOT_IMPLEMENTED. This is a real technical/format gate mislabeled under the wrong state enum value, not a stale dependency block. Per truth rule "Studio offline render is not real-time DSP", this must stay blocked, just correctly labeled.',
}];

const proposal = {
  status: 'PROPOSED_PENDING_OWNER_CONFIRMATION',
  summary: `Reclassify all ${doneTasks.length} DONE tasks to RETRY_READY (marker-only stubs, zero real implementation, confirmed by full census). Relabel 1 mislabeled BLOCKED_BY_DEPENDENCY task to BLOCKED_BY_FORMAT (real gate, wrong enum value). No other state changes proposed.`,
  doneToRetryReadyCount: doneTasks.length,
  doneToRetryReadyByDomain: byDomain,
  rc1CriticalTasksAffected: rc1CriticalAffected,
  mislabeledStateCorrections: mislabeled,
  notApplied: true,
  applyInstructions: 'Run v2-apply-reclassification.mjs <rundir> only after explicit owner confirmation.',
};

fs.writeFileSync(path.join(runDir, 'DONE-RECLASSIFICATION.json'), JSON.stringify(proposal, null, 2));
console.log('proposal written, doneCount=', doneTasks.length, 'rc1CriticalAffected=', rc1CriticalAffected);
