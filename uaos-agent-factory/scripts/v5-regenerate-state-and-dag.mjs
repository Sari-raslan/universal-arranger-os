#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const depsDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'DEPENDENCIES.json'), 'utf8'));
const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));

// --- DAG re-validation (independent recomputation) ---
const adj = new Map();
const danglingEdges = [];
for (const e of depsDoc.edges) {
  if (!byId.has(e.from) || !byId.has(e.to)) { danglingEdges.push(e); continue; }
  if (!adj.has(e.from)) adj.set(e.from, []);
  adj.get(e.from).push(e.to);
}
const WHITE = 0, GRAY = 1, BLACK = 2;
const color = new Map(tasks.map(t => [t.id, WHITE]));
const cycles = [];
for (const start of byId.keys()) {
  if (color.get(start) !== WHITE) continue;
  const stack = [[start, 0]];
  const pathStack = [start];
  color.set(start, GRAY);
  while (stack.length) {
    const [node, idx] = stack[stack.length - 1];
    const children = adj.get(node) || [];
    if (idx < children.length) {
      stack[stack.length - 1][1]++;
      const child = children[idx];
      const c = color.get(child);
      if (c === WHITE) { color.set(child, GRAY); stack.push([child, 0]); pathStack.push(child); }
      else if (c === GRAY) { const cIdx = pathStack.indexOf(child); cycles.push(pathStack.slice(cIdx).concat(child)); }
    } else { color.set(node, BLACK); stack.pop(); pathStack.pop(); }
  }
}
const stateCounts = {};
for (const t of tasks) stateCounts[t.state] = (stateCounts[t.state] || 0) + 1;
const dagResult = {
  generatedAt: new Date().toISOString(),
  totalTasks: tasks.length,
  totalTasksExpected: 1604,
  totalTaskCountValid: tasks.length === 1604,
  totalEdges: depsDoc.edges.length,
  danglingEdgeCount: danglingEdges.length,
  cycleCount: cycles.length,
  stateCounts,
};
fs.writeFileSync(path.join(runDir, 'DAG-VALIDATION-AFTER.json'), JSON.stringify(dagResult, null, 2));

// --- Regenerate CURRENT-EXECUTION-STATE.json ---
const doneCount = stateCounts.DONE || 0;
const readyCount = stateCounts.RETRY_READY || 0;
const blockedCount = tasks.length - doneCount - readyCount;
const state = {
  schema: 'uaos.current-execution-state/v1',
  STATUS: 'UAOS_PROGRAM_TREE_V2_REAL_IMPLEMENTATION_IN_PROGRESS',
  OVERALL: `UAOS_REAL_DONE_${doneCount}_OF_${tasks.length}_REAL_READY_${readyCount}`,
  at: new Date().toISOString(),
  domains: 16,
  epics: 16,
  tasks: tasks.length,
  byState: stateCounts,
  done: doneCount,
  ready: readyCount,
  failed: 0,
  blockedPreserved: blockedCount,
  v2TruthAudit: {
    priorReportedDone: 1284,
    confirmedMarkerOnlyStubs: 1284,
    confirmedGenuineImplementations: 0,
    method: 'full census, not sampling',
    evidenceRun: 'C:/keyboard-manager-clean/uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-claude/run-20260804-213043',
  },
  v2RealImplementation: {
    batch1: { run: 'run-20260804-221849', tasksImplemented: 8, realAssertions: 49 },
    batch2: { run: 'run-20260805-050415', tasksImplemented: 12, realAssertions: 80 },
    batch3: { run: path.basename(runDir), tasksImplemented: 12, realAssertions: 93 },
    cumulativeRealDone: doneCount,
    cumulativeRealAssertions: 49 + 80 + 93,
  },
  commander: 'COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED',
  dashboard: 'http://127.0.0.1:8787/',
  evidenceZip: 'C:/keyboard-manager-clean/uaos-agent-factory/.runtime/artifacts/uaos-program-tree/run-20260804-224922/UAOS-PROGRAM-TREE-EVIDENCE-20260804-224936.zip',
  evidenceSha256: '4BEB6462B728D44F1804090756630028096AF6A66F6EE5671E32A3C2700727EC',
  priorRun: 'C:/keyboard-manager-clean/uaos-agent-factory/.runtime/artifacts/uaos-program-tree/run-20260804-224704',
  safety: { push: false, merge: false, deploy: false, priorWorktreesReadOnly: true },
  wave: 'ACTIVE',
};
fs.writeFileSync(path.join(TREE, 'CURRENT-EXECUTION-STATE.json'), JSON.stringify(state, null, 2));

console.log('DAG:', JSON.stringify(dagResult, null, 2));
console.log('CURRENT-EXECUTION-STATE.json regenerated. done=', doneCount, 'ready=', readyCount, 'blocked=', blockedCount);
