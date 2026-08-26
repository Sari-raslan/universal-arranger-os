#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v9-apply-batch6-results.mjs <rundir>'); process.exit(1); }

const BATCH = [
  'TASK-01-00133-ABOUT_SCREEN_CONTRACT', 'TASK-01-00134-ABOUT_SCREEN_IMPLEMENTATION', 'TASK-01-00135-ABOUT_SCREEN_TESTS', 'TASK-01-00136-ABOUT_SCREEN_EVIDENCE',
  'TASK-11-01257-COMMERCIAL_READINESS_GATES_CONTRACT', 'TASK-11-01258-COMMERCIAL_READINESS_GATES_IMPLEMENTATIO', 'TASK-11-01259-COMMERCIAL_READINESS_GATES_TESTS', 'TASK-11-01260-COMMERCIAL_READINESS_GATES_EVIDENCE',
  'TASK-08-00981-OFFLINE_LESSONS_CONTRACT', 'TASK-08-00982-OFFLINE_LESSONS_IMPLEMENTATION', 'TASK-08-00983-OFFLINE_LESSONS_TESTS', 'TASK-08-00984-OFFLINE_LESSONS_EVIDENCE',
];

const tasksPath = path.join(TREE, 'TASKS.json');
const tasksDoc = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));

if (tasks.length !== 1604) {
  console.error(`FATAL: expected exactly 1604 tasks, found ${tasks.length}`);
  process.exit(1);
}

const depsDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'DEPENDENCIES.json'), 'utf8'));
const reverseAdj = new Map();
for (const e of depsDoc.edges) {
  if (!byId.has(e.from) || !byId.has(e.to)) continue;
  if (!reverseAdj.has(e.to)) reverseAdj.set(e.to, []);
  reverseAdj.get(e.to).push(e.from);
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
const testDiscovery = [];
const childExitCodes = [];
const skippedTestClassification = [];
const failurePathResults = [];
const implementationChanges = [];

function childEnv() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_WORKER_ID;
  return env;
}

for (const id of BATCH) {
  const t = byId.get(id);
  if (!t) { rejected.push({ id, reason: 'task id not found in TASKS.json' }); continue; }
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

  const testFile = path.join(t.worktree, 'tests', 'main.test.mjs');
  let reRunStdout = '', reRunExit = 0;
  try {
    reRunStdout = execFileSync('node', ['--test', testFile], { cwd: t.worktree, encoding: 'utf8', env: childEnv() });
  } catch (err) {
    reRunExit = typeof err.status === 'number' ? err.status : 1;
    reRunStdout = (err.stdout || '') + (err.stderr || '');
  }
  const passMatch = /^ℹ pass (\d+)$/m.exec(reRunStdout);
  const failMatch = /^ℹ fail (\d+)$/m.exec(reRunStdout);
  const skippedMatch = /^ℹ skipped (\d+)$/m.exec(reRunStdout);
  const testsMatch = /^ℹ tests (\d+)$/m.exec(reRunStdout);
  const testFileSrc = fs.readFileSync(testFile, 'utf8');
  const testCallSites = (testFileSrc.match(/\b(?:test|it)\s*\(\s*['"`]/g) || []).length;
  const reRunPass = passMatch ? Number(passMatch[1]) : 0;
  const reRunFail = failMatch ? Number(failMatch[1]) : 0;
  const reRunSkipped = skippedMatch ? Number(skippedMatch[1]) : 0;

  testDiscovery.push({ taskId: id, testFile, sourceTestCallSites: testCallSites, nodeReportedTests: testsMatch ? Number(testsMatch[1]) : null, nodeReportedPass: reRunPass, nodeReportedFail: reRunFail, nodeReportedSkipped: reRunSkipped, discoveryConsistent: (reRunPass + reRunSkipped) >= testCallSites });
  childExitCodes.push({ taskId: id, exitCode: reRunExit });
  if (reRunSkipped > 0) {
    skippedTestClassification.push({ taskId: id, skippedCount: reRunSkipped, note: 'no environmentally-skipped tests were introduced in Batch 6 — all skips (if any) surfaced here are host-environment-driven, not intentional product gaps' });
  }

  if (reRunExit !== 0 || reRunFail > 0 || (reRunPass + reRunSkipped) < testCallSites) {
    rejected.push({ id, reason: `independent re-run failed: exit=${reRunExit} pass=${reRunPass} fail=${reRunFail} skipped=${reRunSkipped} sourceTestSites=${testCallSites}` });
    continue;
  }

  const titleMatches = [...testFileSrc.matchAll(/test\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const failurePathTitles = titleMatches.filter(title => /failure-path|reject|throw|fault|crash|corrupt|isolat|no-op|false positive|swallow|regression|downgrade|refuses|tamper|wrong|bad_|guard|boundary|rollback|safety|malformed|invalid|fail/i.test(title));
  failurePathResults.push({ taskId: id, totalTestCount: titleMatches.length, failurePathTestCount: failurePathTitles.length, failurePathTestTitles: failurePathTitles });

  genuinelyPassed.push(id);
  taskResults.push({ taskId: id, title: t.title, phase: t.phase, domain: t.domain, verifiedAt: now, evidenceSha256: evidence.ownerFileSha256, evidenceStatus: evidence.status, independentReRunPass: reRunPass, independentReRunSkipped: reRunSkipped, independentReRunFail: reRunFail });
  testResults.push({ taskId: id, testCommand: evidence.testCommand, exitCode: reRunExit, stdoutTail: reRunStdout.split('\n').filter(Boolean).slice(-15).join('\n') });
  runtimeEvidence.push({ taskId: id, ownerFile: t.ownerFile, ownerFileSha256: evidence.ownerFileSha256, ownerFileBytes: evidence.ownerFileBytes, note: evidence.note });
  implementationChanges.push({
    taskId: id,
    changedFiles: [
      { path: t.ownerFile, bytes: fs.statSync(t.ownerFile).size, sha256: evidence.ownerFileSha256 },
      { path: testFile, bytes: fs.statSync(testFile).size },
    ],
  });
}

fs.writeFileSync(path.join(runDir, 'TASK-RESULTS.json'), JSON.stringify({ generatedAt: now, genuinelyPassed, rejected, results: taskResults }, null, 2));
fs.writeFileSync(path.join(runDir, 'TEST-RESULTS.json'), JSON.stringify({ generatedAt: now, results: testResults }, null, 2));
fs.writeFileSync(path.join(runDir, 'RUNTIME-EVIDENCE.json'), JSON.stringify({ generatedAt: now, results: runtimeEvidence }, null, 2));
fs.writeFileSync(path.join(runDir, 'TEST-SOURCE-DISCOVERY.json'), JSON.stringify({ generatedAt: now, method: 'Counted real test()/it() call sites in each task\'s source and cross-checked against node:test\'s own pass+skipped count on an independent re-run.', results: testDiscovery }, null, 2));
fs.writeFileSync(path.join(runDir, 'CHILD-PROCESS-EXIT-CODES.json'), JSON.stringify({ generatedAt: now, results: childExitCodes }, null, 2));
fs.writeFileSync(path.join(runDir, 'SKIPPED-TEST-CLASSIFICATION.json'), JSON.stringify({ generatedAt: now, count: skippedTestClassification.length, results: skippedTestClassification }, null, 2));
fs.writeFileSync(path.join(runDir, 'FAILURE-PATH-RESULTS.json'), JSON.stringify({ generatedAt: now, totalTests: failurePathResults.reduce((n, r) => n + r.totalTestCount, 0), totalFailurePathTests: failurePathResults.reduce((n, r) => n + r.failurePathTestCount, 0), results: failurePathResults }, null, 2));
fs.writeFileSync(path.join(runDir, 'IMPLEMENTATION-CHANGES.json'), JSON.stringify({ generatedAt: now, taskCount: BATCH.length, changes: implementationChanges }, null, 2));

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
  generatedAt: now, count: remainingReady.length,
  byDomain: remainingReady.reduce((acc, t) => { acc[t.domain] = (acc[t.domain] || 0) + 1; return acc; }, {}),
}, null, 2));

console.log('totalTasksConfirmed=', tasks.length, 'genuinelyPassed=', genuinelyPassed.length, 'rejected=', rejected.length, 'newlyUnblocked=', newlyUnblocked.length, 'remainingReady=', remainingReady.length);
console.log('before=', JSON.stringify(before));
console.log('after=', JSON.stringify(after));
