#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v3-write-failure-path-evidence.mjs <rundir>'); process.exit(1); }

const BATCH = [
  'TASK-01-00065-ATOMIC_SAVE_CONTRACT',
  'TASK-01-00066-ATOMIC_SAVE_IMPLEMENTATION',
  'TASK-01-00067-ATOMIC_SAVE_TESTS',
  'TASK-01-00068-ATOMIC_SAVE_EVIDENCE',
  'TASK-01-00173-GLOBAL_STOP_CONTRACT_CONTRACT',
  'TASK-01-00174-GLOBAL_STOP_CONTRACT_IMPLEMENTATION',
  'TASK-01-00175-GLOBAL_STOP_CONTRACT_TESTS',
  'TASK-01-00176-GLOBAL_STOP_CONTRACT_EVIDENCE',
];

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

const results = BATCH.map(id => {
  const t = byId.get(id);
  const testPath = path.join(t.worktree, 'tests', 'main.test.mjs');
  const content = fs.readFileSync(testPath, 'utf8');
  // Extract every test('...') / test("...") title, then flag titles that are
  // explicitly exercising a failure/rejection/rollback path rather than the
  // happy path, or reject-* / throws-based regression names.
  const titleMatches = [...content.matchAll(/test\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const failurePathTitles = titleMatches.filter(title => /failure-path|reject|throw|fault|crash|corrupt|isolat|no-op|false positive|swallow/i.test(title));
  return {
    taskId: id,
    testFile: testPath,
    totalTestCount: titleMatches.length,
    failurePathTestCount: failurePathTitles.length,
    failurePathTestTitles: failurePathTitles,
  };
});

fs.writeFileSync(path.join(runDir, 'FAILURE-PATH-EVIDENCE.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  method: 'Parsed each task\'s real tests/main.test.mjs for test() titles, then flagged titles that explicitly exercise a failure/rejection/rollback/fault-isolation scenario rather than the happy path.',
  totalTests: results.reduce((n, r) => n + r.totalTestCount, 0),
  totalFailurePathTests: results.reduce((n, r) => n + r.failurePathTestCount, 0),
  results,
}, null, 2));

console.log(JSON.stringify(results.map(r => ({ taskId: r.taskId, total: r.totalTestCount, failurePath: r.failurePathTestCount })), null, 2));
