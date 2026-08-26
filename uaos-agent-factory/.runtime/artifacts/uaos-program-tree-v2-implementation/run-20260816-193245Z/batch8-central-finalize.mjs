import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PROJECT = 'C:/keyboard-manager-clean';
const TREE = path.join(PROJECT, 'uaos-program-tree');
const RUN = path.join(PROJECT, 'uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/run-20260816-193245Z');
const IDS = [
  'TASK-02-00209-PROVENANCE_CONTRACT', 'TASK-02-00210-PROVENANCE_IMPLEMENTATION', 'TASK-02-00211-PROVENANCE_TESTS', 'TASK-02-00212-PROVENANCE_EVIDENCE',
  'TASK-08-00977-ACCESSIBILITY_CONTRACT', 'TASK-08-00978-ACCESSIBILITY_IMPLEMENTATION', 'TASK-08-00979-ACCESSIBILITY_TESTS', 'TASK-08-00980-ACCESSIBILITY_EVIDENCE',
  'TASK-14-01433-RUNTIME_ACCEPTANCE_CONTRACT', 'TASK-14-01434-RUNTIME_ACCEPTANCE_IMPLEMENTATION', 'TASK-14-01435-RUNTIME_ACCEPTANCE_TESTS', 'TASK-14-01436-RUNTIME_ACCEPTANCE_EVIDENCE',
];

function json(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function write(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function summarize(tasks) {
  const byState = {};
  for (const task of tasks) byState[task.state] = (byState[task.state] || 0) + 1;
  return { total: tasks.length, byState, done: byState.DONE || 0, ready: (byState.READY || 0) + (byState.RETRY_READY || 0), failed: (byState.FAILED || 0) + (byState.RETRY_FAILED || 0) };
}

function dag(tasks, edges) {
  const ids = new Set(tasks.map((task) => task.id));
  const adjacency = new Map(tasks.map((task) => [task.id, []]));
  const indegree = new Map(tasks.map((task) => [task.id, 0]));
  const keys = new Set();
  let dangling = 0;
  let self = 0;
  let duplicate = 0;
  for (const edge of edges) {
    const key = edge.from + '=>' + edge.to + ':' + edge.type;
    if (keys.has(key)) duplicate += 1;
    keys.add(key);
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      dangling += 1;
      continue;
    }
    if (edge.from === edge.to) self += 1;
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
  const result = {
    generatedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    totalTasksExpected: 1604,
    totalTaskCountValid: tasks.length === 1604,
    uniqueTaskIds: ids.size,
    duplicateTaskIdCount: tasks.length - ids.size,
    totalEdges: edges.length,
    danglingEdgeCount: dangling,
    selfDepCount: self,
    duplicateEdgeCount: duplicate,
    cycleNodeCount: tasks.length - visited,
    stateCounts: summarize(tasks).byState,
  };
  result.pass = result.totalTaskCountValid && result.duplicateTaskIdCount === 0 && dangling === 0 && self === 0 && duplicate === 0 && result.cycleNodeCount === 0;
  result.status = result.pass ? 'PASS' : 'FAIL';
  return result;
}

const taskDocument = json(path.join(TREE, 'TASKS.json'));
const dependencyDocument = json(path.join(TREE, 'DEPENDENCIES.json'));
const state = json(path.join(TREE, 'CURRENT-EXECUTION-STATE.json'));
const master = json(path.join(PROJECT, 'reports/CODEX_MASTER_STATE.json'));
const proof = json(path.join(RUN, 'TASK-RESULTS.json'));
const tests = json(path.join(RUN, 'TEST-RESULTS.json'));
const review = json(path.join(RUN, 'INDEPENDENT-REVIEW.json'));
const taskCounts = summarize(taskDocument.tasks);
const validation = dag(taskDocument.tasks, dependencyDocument.edges);
const byId = new Map(taskDocument.tasks.map((task) => [task.id, task]));
const selectedDone = IDS.every((id) => byId.get(id)?.state === 'DONE');
const currentStateCountsMatch = JSON.stringify(state.byState) === JSON.stringify(taskCounts.byState);
const masterMatches = master.programTree?.done === 92 && master.programTree?.ready === 298 && master.programTree?.failed === 0 && master.programTree?.run === 'run-20260816-193245Z';
if (proof.status !== 'PASS' || tests.status !== 'PASS' || review.status !== 'PASS') throw new Error('Implementation proof is not PASS');
if (taskCounts.done !== 92 || taskCounts.ready !== 298 || taskCounts.failed !== 0 || !selectedDone || !currentStateCountsMatch || !masterMatches || validation.status !== 'PASS') throw new Error('Applied central state does not pass finalization invariants');

const central = [
  { name: 'TASKS.json', current: path.join(TREE, 'TASKS.json') },
  { name: 'DEPENDENCIES.json', current: path.join(TREE, 'DEPENDENCIES.json') },
  { name: 'CURRENT-EXECUTION-STATE.json', current: path.join(TREE, 'CURRENT-EXECUTION-STATE.json') },
].map((item) => ({
  path: item.current.replaceAll('\\', '/'),
  beforeSha256: sha(path.join(RUN, 'central-files-backup', item.name)),
  afterSha256: sha(item.current),
  ...(item.name === 'DEPENDENCIES.json' ? { note: 'validated; no structural dependency change required' } : {}),
}));
const reports = [
  { name: 'CODEX_MASTER_STATE.json', current: path.join(PROJECT, 'reports/CODEX_MASTER_STATE.json') },
  { name: 'CODEX_BLOCKERS.md', current: path.join(PROJECT, 'reports/CODEX_BLOCKERS.md') },
  { name: 'CODEX_CHANGELOG.md', current: path.join(PROJECT, 'reports/CODEX_CHANGELOG.md') },
].map((item) => ({ path: item.current.replaceAll('\\', '/'), beforeSha256: sha(path.join(RUN, 'durable-reports-backup', item.name)), afterSha256: sha(item.current) }));
const before = json(path.join(RUN, 'TASK-STATE-COUNTS-BEFORE.json'));
const now = new Date().toISOString();
const remaining = taskDocument.tasks.filter((task) => task.state === 'RETRY_READY');
write(path.join(RUN, 'TASK-STATE-COUNTS-AFTER.json'), { generatedAt: now, ...taskCounts });
write(path.join(RUN, 'DAG-VALIDATION-AFTER.json'), { ...validation, selectedDone, currentStateCountsMatch, masterMatches });
write(path.join(RUN, 'NEWLY-UNBLOCKED-TASKS.json'), { generatedAt: now, count: 0, tasks: [] });
write(path.join(RUN, 'REMAINING-READY-TASKS.json'), { generatedAt: now, count: remaining.length, byDomain: remaining.reduce((accumulator, task) => { accumulator[task.domain] = (accumulator[task.domain] || 0) + 1; return accumulator; }, {}) });
write(path.join(RUN, 'CENTRAL-TRANSACTION-RESULT.json'), {
  generatedAt: now,
  status: 'PASS',
  recoveryNote: 'The guarded write and post-write validation succeeded. A variable-name error occurred only while serializing the first final DAG artifact; this idempotent finalizer revalidated current disk truth and completed the artifact set.',
  tasksUpdated: IDS,
  dependencyEdgesChanged: 0,
  newlyUnblocked: [],
  beforeCounts: before.byState,
  afterCounts: taskCounts.byState,
  centralFiles: central,
  durableReports: reports,
  dag: { ...validation, selectedDone, currentStateCountsMatch, masterMatches },
});
write(path.join(RUN, 'BLOCKERS.json'), {
  generatedAt: now,
  status: 'NO_NEW_BATCH_BLOCKER',
  blockers: master.blockers,
  batchSafetyGates: ['No deploy/public release', 'No payment/checkout', 'No auth/credentials', 'No hardware/USB/SysEx/proprietary writer', 'No Commander access', 'No copied commercial content'],
});
console.log(JSON.stringify({ status: 'PASS', tasks: taskCounts.total, edges: dependencyDocument.edges.length, done: taskCounts.done, ready: taskCounts.ready, failed: taskCounts.failed, selectedDone, currentStateCountsMatch, masterMatches }, null, 2));
