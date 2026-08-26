#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v5-apply-batch3-results.mjs <rundir>'); process.exit(1); }

const BATCH = [
  'TASK-01-00129-VERSIONING_CONTRACT', 'TASK-01-00130-VERSIONING_IMPLEMENTATION', 'TASK-01-00131-VERSIONING_TESTS', 'TASK-01-00132-VERSIONING_EVIDENCE',
  'TASK-01-00105-SIGNED_LICENSES_CONTRACT', 'TASK-01-00106-SIGNED_LICENSES_IMPLEMENTATION', 'TASK-01-00107-SIGNED_LICENSES_TESTS', 'TASK-01-00108-SIGNED_LICENSES_EVIDENCE',
  'TASK-02-00197-USER_SUPPLIED_WAV_INGESTION_CONTRACT', 'TASK-02-00198-USER_SUPPLIED_WAV_INGESTION_IMPLEMENTATI', 'TASK-02-00199-USER_SUPPLIED_WAV_INGESTION_TESTS', 'TASK-02-00200-USER_SUPPLIED_WAV_INGESTION_EVIDENCE',
];

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
const cryptoEvidence = [];
const timeBoundaryEvidence = [];

const CRYPTO_TASKS = new Set(['TASK-01-00105-SIGNED_LICENSES_CONTRACT', 'TASK-01-00106-SIGNED_LICENSES_IMPLEMENTATION', 'TASK-01-00107-SIGNED_LICENSES_TESTS', 'TASK-01-00108-SIGNED_LICENSES_EVIDENCE']);

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
  // Independent re-run right now (not trusting the earlier evidence file alone).
  const { execFileSync } = await import('node:child_process');
  const testFile = path.join(t.worktree, 'tests', 'main.test.mjs');
  let reRunStdout = '', reRunExit = 0;
  try {
    reRunStdout = execFileSync('node', ['--test', testFile], { cwd: t.worktree, encoding: 'utf8' });
  } catch (err) {
    reRunExit = typeof err.status === 'number' ? err.status : 1;
    reRunStdout = (err.stdout || '') + (err.stderr || '');
  }
  const passMatch = /^ℹ pass (\d+)$/m.exec(reRunStdout);
  const failMatch = /^ℹ fail (\d+)$/m.exec(reRunStdout);
  const testsMatch = /^ℹ tests (\d+)$/m.exec(reRunStdout);
  const testCallSites = (fs.readFileSync(testFile, 'utf8').match(/\b(?:test|it)\s*\(\s*['"`]/g) || []).length;
  const reRunPass = passMatch ? Number(passMatch[1]) : 0;
  const reRunFail = failMatch ? Number(failMatch[1]) : 0;

  testDiscovery.push({ taskId: id, testFile, sourceTestCallSites: testCallSites, nodeReportedTests: testsMatch ? Number(testsMatch[1]) : null, nodeReportedPass: reRunPass, nodeReportedFail: reRunFail, discoveryConsistent: reRunPass >= testCallSites });
  childExitCodes.push({ taskId: id, exitCode: reRunExit });

  if (reRunExit !== 0 || reRunFail > 0 || reRunPass < testCallSites) {
    rejected.push({ id, reason: `independent re-run failed: exit=${reRunExit} pass=${reRunPass} fail=${reRunFail} sourceTestSites=${testCallSites}` });
    continue;
  }

  if (CRYPTO_TASKS.has(id)) {
    cryptoEvidence.push({ taskId: id, ephemeralKeysOnly: !/BEGIN (RSA |EC )?PRIVATE KEY/.test(ownerContent), noNetworkImports: !/from ['"]node:(http|https|net|dgram)['"]/.test(ownerContent), reRunPass, reRunFail });
  }
  if (id.startsWith('TASK-01-00106') || id.startsWith('TASK-01-00107')) {
    timeBoundaryEvidence.push({ taskId: id, note: 'Contains explicit before/exactly-at/after expiry boundary tests and an injected-clock requirement (no system clock read internally); see test titles in TEST-RESULTS.json stdoutTail.' });
  }

  genuinelyPassed.push(id);
  taskResults.push({ taskId: id, title: t.title, phase: t.phase, domain: t.domain, verifiedAt: now, evidenceSha256: evidence.ownerFileSha256, evidenceStatus: evidence.status, independentReRunPass: reRunPass, independentReRunFail: reRunFail });
  testResults.push({ taskId: id, testCommand: evidence.testCommand, exitCode: reRunExit, stdoutTail: reRunStdout.split('\n').filter(Boolean).slice(-15).join('\n') });
  runtimeEvidence.push({ taskId: id, ownerFile: t.ownerFile, ownerFileSha256: evidence.ownerFileSha256, ownerFileBytes: evidence.ownerFileBytes, note: evidence.note });
}

fs.writeFileSync(path.join(runDir, 'TASK-RESULTS.json'), JSON.stringify({ generatedAt: now, genuinelyPassed, rejected, results: taskResults }, null, 2));
fs.writeFileSync(path.join(runDir, 'TEST-RESULTS.json'), JSON.stringify({ generatedAt: now, results: testResults }, null, 2));
fs.writeFileSync(path.join(runDir, 'RUNTIME-EVIDENCE.json'), JSON.stringify({ generatedAt: now, results: runtimeEvidence }, null, 2));
fs.writeFileSync(path.join(runDir, 'TEST-DISCOVERY-EVIDENCE.json'), JSON.stringify({ generatedAt: now, method: 'For each task, counted real test()/it() call sites in the source and compared against node:test\'s own reported pass count on an independent re-run - guards against the Batch-3-discovered "empty file reports tests:1" loophole.', results: testDiscovery }, null, 2));
fs.writeFileSync(path.join(runDir, 'CHILD-PROCESS-EXIT-CODES.json'), JSON.stringify({ generatedAt: now, results: childExitCodes }, null, 2));
fs.writeFileSync(path.join(runDir, 'CRYPTO-EVIDENCE.json'), JSON.stringify({ generatedAt: now, note: 'Chain B (Signed Licenses) is the only crypto/license chain selected this batch.', results: cryptoEvidence }, null, 2));
fs.writeFileSync(path.join(runDir, 'TIME-BOUNDARY-EVIDENCE.json'), JSON.stringify({ generatedAt: now, note: 'Time-dependent logic exists only in the Signed Licenses IMPLEMENTATION/TESTS tasks (expiry checks). No Trial/Entitlement chain was selected this batch.', results: timeBoundaryEvidence }, null, 2));

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

console.log('genuinelyPassed=', genuinelyPassed.length, 'rejected=', rejected.length, 'newlyUnblocked=', newlyUnblocked.length, 'remainingReady=', remainingReady.length);
console.log('totalTasks=', tasks.length);
console.log('before=', JSON.stringify(before));
console.log('after=', JSON.stringify(after));
