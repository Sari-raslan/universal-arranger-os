import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PROJECT = 'C:/keyboard-manager-clean';
const TREE = path.join(PROJECT, 'uaos-program-tree');
const RUN = path.join(PROJECT, 'uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/run-20260816-193245Z');
const TASK_IDS = [
  'TASK-02-00209-PROVENANCE_CONTRACT',
  'TASK-02-00210-PROVENANCE_IMPLEMENTATION',
  'TASK-02-00211-PROVENANCE_TESTS',
  'TASK-02-00212-PROVENANCE_EVIDENCE',
  'TASK-08-00977-ACCESSIBILITY_CONTRACT',
  'TASK-08-00978-ACCESSIBILITY_IMPLEMENTATION',
  'TASK-08-00979-ACCESSIBILITY_TESTS',
  'TASK-08-00980-ACCESSIBILITY_EVIDENCE',
  'TASK-14-01433-RUNTIME_ACCEPTANCE_CONTRACT',
  'TASK-14-01434-RUNTIME_ACCEPTANCE_IMPLEMENTATION',
  'TASK-14-01435-RUNTIME_ACCEPTANCE_TESTS',
  'TASK-14-01436-RUNTIME_ACCEPTANCE_EVIDENCE',
];
const CENTRAL_FILES = [
  path.join(TREE, 'TASKS.json'),
  path.join(TREE, 'DEPENDENCIES.json'),
  path.join(TREE, 'CURRENT-EXECUTION-STATE.json'),
];
const REPORT_FILES = [
  path.join(PROJECT, 'reports/CODEX_MASTER_STATE.json'),
  path.join(PROJECT, 'reports/CODEX_BLOCKERS.md'),
  path.join(PROJECT, 'reports/CODEX_CHANGELOG.md'),
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function counts(tasks) {
  const byState = {};
  for (const task of tasks) byState[task.state] = (byState[task.state] || 0) + 1;
  return {
    byState,
    total: tasks.length,
    done: byState.DONE || 0,
    ready: (byState.READY || 0) + (byState.RETRY_READY || 0),
    failed: (byState.FAILED || 0) + (byState.RETRY_FAILED || 0),
  };
}

function validateDag(tasks, edges) {
  const ids = new Set();
  const duplicateTaskIds = [];
  for (const task of tasks) {
    if (ids.has(task.id)) duplicateTaskIds.push(task.id);
    ids.add(task.id);
  }
  const danglingEdges = [];
  const selfEdges = [];
  const duplicateEdges = [];
  const edgeKeys = new Set();
  const adjacency = new Map(tasks.map((task) => [task.id, []]));
  const indegree = new Map(tasks.map((task) => [task.id, 0]));
  for (const edge of edges) {
    const key = edge.from + '=>' + edge.to + ':' + edge.type;
    if (edgeKeys.has(key)) duplicateEdges.push(key);
    edgeKeys.add(key);
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      danglingEdges.push(edge);
      continue;
    }
    if (edge.from === edge.to) selfEdges.push(edge);
    adjacency.get(edge.from).push(edge.to);
    indegree.set(edge.to, indegree.get(edge.to) + 1);
  }
  const queue = [...indegree].filter((entry) => entry[1] === 0).map((entry) => entry[0]);
  let visited = 0;
  while (queue.length) {
    const id = queue.shift();
    visited += 1;
    for (const next of adjacency.get(id)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  const state = counts(tasks);
  const result = {
    generatedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    totalTasksExpected: 1604,
    totalTaskCountValid: tasks.length === 1604,
    uniqueTaskIds: ids.size,
    duplicateTaskIdCount: duplicateTaskIds.length,
    totalEdges: edges.length,
    danglingEdgeCount: danglingEdges.length,
    selfDepCount: selfEdges.length,
    duplicateEdgeCount: duplicateEdges.length,
    cycleNodeCount: tasks.length - visited,
    stateCounts: state.byState,
  };
  result.pass = result.totalTaskCountValid && result.duplicateTaskIdCount === 0 && result.danglingEdgeCount === 0 && result.selfDepCount === 0 && result.duplicateEdgeCount === 0 && result.cycleNodeCount === 0;
  result.status = result.pass ? 'PASS' : 'FAIL';
  return result;
}

function backupFiles(files, directory) {
  fs.mkdirSync(directory, { recursive: true });
  const entries = files.map((file) => {
    const destination = path.join(directory, path.basename(file));
    fs.copyFileSync(file, destination);
    return { source: file.replaceAll('\\', '/'), backup: destination.replaceAll('\\', '/'), sha256: sha256File(destination), bytes: fs.statSync(destination).size };
  });
  return entries;
}

const proof = readJson(path.join(RUN, 'TASK-RESULTS.json'));
const tests = readJson(path.join(RUN, 'TEST-RESULTS.json'));
const review = readJson(path.join(RUN, 'INDEPENDENT-REVIEW.json'));
const children = readJson(path.join(RUN, 'CHILD-PROCESS-EXIT-CODES.json'));
const changes = readJson(path.join(RUN, 'IMPLEMENTATION-CHANGES.json'));
const failurePaths = readJson(path.join(RUN, 'FAILURE-PATH-RESULTS.json'));
if (proof.status !== 'PASS' || JSON.stringify(proof.genuinelyPassed) !== JSON.stringify(TASK_IDS)) throw new Error('Task proof is incomplete');
if (tests.status !== 'PASS' || tests.assertions !== 67 || tests.failedAssertions !== 0 || tests.skippedAssertions !== 0) throw new Error('Test proof is incomplete');
if (review.status !== 'PASS' || failurePaths.status !== 'PASS') throw new Error('Independent review or failure-path proof is incomplete');
if (children.count !== 24 || children.results.some((item) => item.exitCode !== 0)) throw new Error('Child process proof is incomplete');
if (changes.taskCount !== 12) throw new Error('Changed-file evidence is incomplete');

const tasksPath = CENTRAL_FILES[0];
const dependenciesPath = CENTRAL_FILES[1];
const statePath = CENTRAL_FILES[2];
const tasksDocument = readJson(tasksPath);
const dependenciesDocument = readJson(dependenciesPath);
const stateDocument = readJson(statePath);
const masterDocument = readJson(REPORT_FILES[0]);
const beforeTasksText = fs.readFileSync(tasksPath, 'utf8');
const beforeStateText = fs.readFileSync(statePath, 'utf8');
const beforeMasterText = fs.readFileSync(REPORT_FILES[0], 'utf8');
const beforeBlockersText = fs.readFileSync(REPORT_FILES[1], 'utf8');
const beforeChangelogText = fs.readFileSync(REPORT_FILES[2], 'utf8');
const tasks = tasksDocument.tasks;
const edges = dependenciesDocument.edges;
const byId = new Map(tasks.map((task) => [task.id, task]));
const beforeCounts = counts(tasks);
const dagBefore = validateDag(tasks, edges);
if (beforeCounts.total !== 1604 || beforeCounts.done !== 80 || beforeCounts.ready !== 301 || beforeCounts.failed !== 0 || dagBefore.status !== 'PASS') throw new Error('Central state changed after proof and before transaction');

const reverse = new Map();
for (const edge of edges) {
  if (!reverse.has(edge.to)) reverse.set(edge.to, []);
  reverse.get(edge.to).push(edge.from);
}
for (const id of TASK_IDS) {
  const task = byId.get(id);
  if (!task) throw new Error('Missing selected task ' + id);
  const expectedState = [TASK_IDS[0], TASK_IDS[4], TASK_IDS[8]].includes(id) ? 'RETRY_READY' : 'BLOCKED_BY_DEPENDENCY';
  if (task.state !== expectedState) throw new Error('Unexpected pre-transaction state for ' + id);
  const evidence = readJson(task.evidence[0]);
  const receipt = evidence.receiptSha256;
  const body = { ...evidence };
  delete body.receiptSha256;
  if (evidence.status !== 'PASS' || receipt !== sha256Text(JSON.stringify(body))) throw new Error('Invalid task evidence receipt for ' + id);
  const taskChange = changes.changes.find((entry) => entry.taskId === id);
  for (const changedFile of taskChange.changedFiles) {
    if (!fs.existsSync(changedFile.path) || sha256File(changedFile.path) !== changedFile.afterSha256) throw new Error('Changed-file hash mismatch for ' + id);
  }
}

const centralBefore = CENTRAL_FILES.map((file) => ({ path: file.replaceAll('\\', '/'), beforeSha256: sha256File(file) }));
const reportBefore = REPORT_FILES.map((file) => ({ path: file.replaceAll('\\', '/'), beforeSha256: sha256File(file) }));
const centralBackup = backupFiles(CENTRAL_FILES, path.join(RUN, 'central-files-backup'));
const reportsBackup = backupFiles(REPORT_FILES, path.join(RUN, 'durable-reports-backup'));
writeJson(path.join(RUN, 'CENTRAL-FILES-BACKUP-MANIFEST.json'), { generatedAt: new Date().toISOString(), files: centralBackup });
writeJson(path.join(RUN, 'DURABLE-REPORTS-BACKUP-MANIFEST.json'), { generatedAt: new Date().toISOString(), files: reportsBackup });

const now = new Date().toISOString();
for (const id of TASK_IDS) {
  const task = byId.get(id);
  task.state = 'DONE';
  task.blockedReason = null;
  task.updatedAt = now;
}
const newlyUnblocked = [];
for (const task of tasks) {
  if (task.state !== 'BLOCKED_BY_DEPENDENCY') continue;
  const predecessors = reverse.get(task.id) || [];
  if (predecessors.length > 0 && predecessors.every((id) => byId.get(id)?.state === 'DONE')) {
    task.state = 'RETRY_READY';
    task.blockedReason = null;
    task.updatedAt = now;
    newlyUnblocked.push({ id: task.id, title: task.title, unblockedBy: predecessors });
  }
}
const afterCounts = counts(tasks);
const dagAfter = validateDag(tasks, edges);
const selectedDone = TASK_IDS.every((id) => byId.get(id).state === 'DONE');
if (afterCounts.done !== 92 || afterCounts.ready !== 298 || afterCounts.failed !== 0 || !selectedDone || dagAfter.status !== 'PASS') throw new Error('Computed Batch 8 central state failed invariants');

const nextState = {
  ...stateDocument,
  STATUS: 'UAOS_PROGRAM_TREE_V2_REAL_IMPLEMENTATION_IN_PROGRESS',
  OVERALL: 'UAOS_REAL_DONE_92_OF_1604_REAL_READY_298',
  at: now,
  tasks: 1604,
  byState: afterCounts.byState,
  done: 92,
  ready: 298,
  failed: 0,
  blockedPreserved: 1214,
  v2RealImplementation: {
    ...stateDocument.v2RealImplementation,
    batch8: {
      run: 'run-20260816-193245Z',
      tasksImplemented: 12,
      realAssertions: 67,
      note: 'Library provenance metadata and tamper-evident ledger; Singy Kids bilingual accessibility planning and audit; local-observation-only runtime acceptance. No deploy, payment, network, hardware, SysEx, proprietary writer, Commander, or copied commercial content.',
    },
    cumulativeRealDone: 92,
    cumulativeRealAssertions: 678,
  },
  safety: {
    ...stateDocument.safety,
    push: false,
    merge: false,
    deploy: false,
    priorWorktreesReadOnly: true,
    hardwareOutput: false,
    proprietaryWriter: false,
  },
  wave: 'ACTIVE',
};
const currentCountsMatch = JSON.stringify(nextState.byState) === JSON.stringify(dagAfter.stateCounts);
if (!currentCountsMatch) throw new Error('CURRENT-EXECUTION-STATE counts do not match DAG');

const nextMaster = {
  ...masterDocument,
  currentPhase: 'PROGRAM_TREE_V2_REAL_IMPLEMENTATION',
  phaseStatus: 'IN_PROGRESS',
  lastCompletedTask: 'UAOS_PROGRAM_TREE_V2_BATCH_8',
  nextTask: 'UAOS_PROGRAM_TREE_V2_BATCH_9_SELECTION',
  lastSuccessfulCommand: '12 exact node --test commands plus 12 node --check commands: 67 pass, 0 fail, 0 skipped',
  buildStatus: 'NOT_RUN_BATCH_SCOPED_NODE_TESTS_ONLY',
  testStatus: 'PASS',
  updatedAt: now,
  programTree: {
    schema: 'uaos.program-tree-batch-summary/v1',
    run: 'run-20260816-193245Z',
    totalTasks: 1604,
    done: 92,
    ready: 298,
    failed: 0,
    totalEdges: edges.length,
    dagStatus: 'PASS',
    tasksImplemented: 12,
    assertions: 67,
    artifactRun: RUN.replaceAll('\\', '/'),
  },
};

const blockerSection = [
  '',
  '## Program Tree V2 Continuous Safe Batch 8 — 2026-08-16',
  '',
  '- Status: PASS; no new Batch 8 product blocker.',
  '- Preserved manual gates: microphone browser permission and real MIDI hardware validation.',
  '- Preserved packaged-build gate: automatic updater network validation requires the intended signed package/provider.',
  '- Preserved environment blocker: Windows may refuse to unlink the rolldown native binding during npm ci; Batch 8 did not run installs.',
  '- Batch 8 intentionally performed no deploy, payment, authentication, network, hardware, SysEx, proprietary writer, Commander, or copied commercial-content action.',
  '',
].join('\n');
const changelogSection = [
  '',
  '## 2026-08-16 — Program Tree V2 Continuous Safe Batch 8',
  '',
  '- Completed 12 exact tasks across Library Factory provenance, Singy Kids accessibility, and QA runtime acceptance.',
  '- Added real metadata provenance validation, a deterministic SHA-256 event ledger, conformance testing, and sealed evidence.',
  '- Added bilingual Arabic/English accessible lesson planning with RTL, keyboard focus, visible live feedback, adjustable timing, high contrast, and reduced motion.',
  '- Added local-observation-only runtime acceptance manifests, fail-closed evaluation, matrix testing, and sealed evidence.',
  '- Verification: 12 exact node --test commands, 67 assertions passed, 0 failed, 0 skipped; 12 syntax checks passed.',
  '- DAG after transaction: 1604 tasks, 1217 edges, 92 DONE, 298 RETRY_READY, 0 FAILED, no cycles or invalid edges.',
  '',
].join('\n');
const nextBlockers = beforeBlockersText.includes('Program Tree V2 Continuous Safe Batch 8') ? beforeBlockersText : beforeBlockersText.trimEnd() + blockerSection;
const nextChangelog = beforeChangelogText.includes('Program Tree V2 Continuous Safe Batch 8') ? beforeChangelogText : beforeChangelogText.trimEnd() + changelogSection;

try {
  writeJson(tasksPath, tasksDocument);
  writeJson(statePath, nextState);
  writeJson(REPORT_FILES[0], nextMaster);
  fs.writeFileSync(REPORT_FILES[1], nextBlockers, 'utf8');
  fs.writeFileSync(REPORT_FILES[2], nextChangelog, 'utf8');

  const actualTasks = readJson(tasksPath);
  const actualState = readJson(statePath);
  const actualMaster = readJson(REPORT_FILES[0]);
  const actualDag = validateDag(actualTasks.tasks, dependenciesDocument.edges);
  const actualCounts = counts(actualTasks.tasks);
  if (actualDag.status !== 'PASS' || actualCounts.done !== 92 || actualCounts.ready !== 298 || actualState.done !== 92 || actualState.ready !== 298 || actualMaster.programTree.done !== 92) throw new Error('Post-write validation failed');
} catch (error) {
  fs.writeFileSync(tasksPath, beforeTasksText, 'utf8');
  fs.writeFileSync(statePath, beforeStateText, 'utf8');
  fs.writeFileSync(REPORT_FILES[0], beforeMasterText, 'utf8');
  fs.writeFileSync(REPORT_FILES[1], beforeBlockersText, 'utf8');
  fs.writeFileSync(REPORT_FILES[2], beforeChangelogText, 'utf8');
  writeJson(path.join(RUN, 'CENTRAL-TRANSACTION-RESULT.json'), { generatedAt: new Date().toISOString(), status: 'FAIL_ROLLED_BACK', error: error instanceof Error ? error.message : String(error) });
  throw error;
}

const centralAfter = centralBefore.map((entry) => ({ ...entry, afterSha256: sha256File(entry.path), ...(entry.path.endsWith('/DEPENDENCIES.json') ? { note: 'validated; no structural dependency change required' } : {}) }));
const reportsAfter = reportBefore.map((entry) => ({ ...entry, afterSha256: sha256File(entry.path) }));
writeJson(path.join(RUN, 'TASK-STATE-COUNTS-AFTER.json'), { generatedAt: now, ...afterCounts });
writeJson(path.join(RUN, 'DAG-VALIDATION-AFTER.json'), { ...dagAfter, selectedDone, currentStateCountsMatch: currentCountsMatch });
writeJson(path.join(RUN, 'NEWLY-UNBLOCKED-TASKS.json'), { generatedAt: now, count: newlyUnblocked.length, tasks: newlyUnblocked });
const remainingReady = tasks.filter((task) => task.state === 'RETRY_READY');
writeJson(path.join(RUN, 'REMAINING-READY-TASKS.json'), { generatedAt: now, count: remainingReady.length, byDomain: remainingReady.reduce((accumulator, task) => { accumulator[task.domain] = (accumulator[task.domain] || 0) + 1; return accumulator; }, {}) });
writeJson(path.join(RUN, 'CENTRAL-TRANSACTION-RESULT.json'), {
  generatedAt: now,
  status: 'PASS',
  tasksUpdated: TASK_IDS,
  dependencyEdgesChanged: 0,
  newlyUnblocked,
  beforeCounts: beforeCounts.byState,
  afterCounts: afterCounts.byState,
  centralFiles: centralAfter,
  durableReports: reportsAfter,
  dag: { ...dagAfter, selectedDone, currentStateCountsMatch: currentCountsMatch },
});
writeJson(path.join(RUN, 'BLOCKERS.json'), {
  generatedAt: now,
  status: 'NO_NEW_BATCH_BLOCKER',
  blockers: nextMaster.blockers,
  batchSafetyGates: ['No deploy/public release', 'No payment/checkout', 'No auth/credentials', 'No hardware/USB/SysEx/proprietary writer', 'No Commander access', 'No copied commercial content'],
});

console.log(JSON.stringify({ status: 'PASS', before: { done: beforeCounts.done, ready: beforeCounts.ready, failed: beforeCounts.failed }, after: { done: afterCounts.done, ready: afterCounts.ready, failed: afterCounts.failed }, tasks: tasks.length, edges: edges.length, newlyUnblocked: newlyUnblocked.length, run: RUN }, null, 2));
