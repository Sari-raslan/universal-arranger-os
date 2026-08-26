#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v4-apply-batch2-results.mjs <rundir>'); process.exit(1); }

const BATCH = [
  'TASK-01-00057-SHARED_PROJECT_IDENTITY_CONTRACT', 'TASK-01-00058-SHARED_PROJECT_IDENTITY_IMPLEMENTATION', 'TASK-01-00059-SHARED_PROJECT_IDENTITY_TESTS', 'TASK-01-00060-SHARED_PROJECT_IDENTITY_EVIDENCE',
  'TASK-01-00073-RECOVERY_CONTRACT', 'TASK-01-00074-RECOVERY_IMPLEMENTATION', 'TASK-01-00075-RECOVERY_TESTS', 'TASK-01-00076-RECOVERY_EVIDENCE',
  'TASK-06-00653-PROJECT_SYSTEM_CONTRACT', 'TASK-06-00654-PROJECT_SYSTEM_IMPLEMENTATION', 'TASK-06-00655-PROJECT_SYSTEM_TESTS', 'TASK-06-00656-PROJECT_SYSTEM_EVIDENCE',
];

const tasksPath = path.join(TREE, 'TASKS.json');
const tasksDoc = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));

const depsDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'DEPENDENCIES.json'), 'utf8'));
const reverseAdj = new Map();
const fwdAdj = new Map();
for (const e of depsDoc.edges) {
  if (!byId.has(e.from) || !byId.has(e.to)) continue;
  if (!reverseAdj.has(e.to)) reverseAdj.set(e.to, []);
  reverseAdj.get(e.to).push(e.from);
  if (!fwdAdj.has(e.from)) fwdAdj.set(e.from, []);
  fwdAdj.get(e.from).push(e.to);
}

const before = {};
for (const t of tasks) before[t.state] = (before[t.state] || 0) + 1;
fs.writeFileSync(path.join(runDir, 'TASK-STATE-COUNTS-BEFORE.json'), JSON.stringify({ generatedAt: new Date().toISOString(), stateCounts: before, totalTasks: tasks.length }, null, 2));

const now = new Date().toISOString();
const genuinelyPassed = [];
const rejected = [];
const taskResults = [];
const testResults = [];
const runtimeEvidence = [];

for (const id of BATCH) {
  const t = byId.get(id);
  const evidencePath = t.evidence[0].replace(/\//g, '\\');
  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  } catch (err) {
    rejected.push({ id, reason: `evidence file unreadable: ${err.message}` });
    continue;
  }
  if (evidence.status !== 'PASS') {
    rejected.push({ id, reason: `evidence status is '${evidence.status}', not PASS`, evidence });
    continue;
  }
  const ownerContent = fs.readFileSync(t.ownerFile, 'utf8');
  if (/CONTRACT_STUB_EXECUTED|MARKER_ONLY/.test(ownerContent)) {
    rejected.push({ id, reason: 'ownerFile still contains a banned marker-only pattern' });
    continue;
  }
  genuinelyPassed.push(id);
  taskResults.push({ taskId: id, title: t.title, phase: t.phase, domain: t.domain, verifiedAt: now, evidenceSha256: evidence.ownerFileSha256, evidenceStatus: evidence.status });
  testResults.push({ taskId: id, testCommand: evidence.testCommand, exitCode: evidence.exitCode, stdoutTail: evidence.stdoutTail });
  runtimeEvidence.push({ taskId: id, ownerFile: t.ownerFile, ownerFileSha256: evidence.ownerFileSha256, ownerFileBytes: evidence.ownerFileBytes, note: evidence.note });
}

fs.writeFileSync(path.join(runDir, 'TASK-RESULTS.json'), JSON.stringify({ generatedAt: now, genuinelyPassed, rejected, results: taskResults }, null, 2));
fs.writeFileSync(path.join(runDir, 'TEST-RESULTS.json'), JSON.stringify({ generatedAt: now, results: testResults }, null, 2));
fs.writeFileSync(path.join(runDir, 'RUNTIME-EVIDENCE.json'), JSON.stringify({ generatedAt: now, results: runtimeEvidence }, null, 2));

if (rejected.length > 0) console.error('REJECTED:', JSON.stringify(rejected, null, 2));

for (const id of genuinelyPassed) {
  const t = byId.get(id);
  t.state = 'DONE';
  t.blockedReason = null;
  t.updatedAt = now;
}

const newlyUnblocked = [];
for (const t of tasks) {
  if (t.state !== 'BLOCKED_BY_DEPENDENCY') continue;
  const preds = reverseAdj.get(t.id) || [];
  if (preds.length > 0 && preds.every(p => byId.get(p)?.state === 'DONE')) {
    t.state = 'RETRY_READY';
    t.blockedReason = null;
    t.updatedAt = now;
    newlyUnblocked.push({ id: t.id, title: t.title, unblockedBy: preds });
  }
}

fs.writeFileSync(tasksPath, JSON.stringify(tasksDoc, null, 2));
fs.writeFileSync(path.join(runDir, 'NEWLY-UNBLOCKED-TASKS.json'), JSON.stringify({ generatedAt: now, count: newlyUnblocked.length, tasks: newlyUnblocked }, null, 2));

const after = {};
for (const t of tasks) after[t.state] = (after[t.state] || 0) + 1;
fs.writeFileSync(path.join(runDir, 'TASK-STATE-COUNTS-AFTER.json'), JSON.stringify({ generatedAt: now, stateCounts: after, totalTasks: tasks.length }, null, 2));

const remainingReady = tasks.filter(t => t.state === 'RETRY_READY');
fs.writeFileSync(path.join(runDir, 'REMAINING-READY-TASKS.json'), JSON.stringify({
  generatedAt: now,
  count: remainingReady.length,
  byDomain: remainingReady.reduce((acc, t) => { acc[t.domain] = (acc[t.domain] || 0) + 1; return acc; }, {}),
}, null, 2));

console.log('genuinelyPassed=', genuinelyPassed.length, 'rejected=', rejected.length, 'newlyUnblocked=', newlyUnblocked.length, 'remainingReady=', remainingReady.length);
console.log('before=', JSON.stringify(before));
console.log('after=', JSON.stringify(after));
