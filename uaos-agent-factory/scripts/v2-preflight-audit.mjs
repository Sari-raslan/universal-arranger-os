#!/usr/bin/env node
// UAOS Program Tree V2 — deterministic preflight + DAG validation + task-state counts.
// Operates on TASKS.json / DEPENDENCIES.json without loading full task bodies into an LLM context.
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const RUNDIR = process.argv[2];
if (!RUNDIR) { console.error('usage: node v2-preflight-audit.mjs <rundir>'); process.exit(1); }

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const depsDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'DEPENDENCIES.json'), 'utf8'));

const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));

// ---- Task state counts ----
const stateCounts = {};
for (const t of tasks) stateCounts[t.state] = (stateCounts[t.state] || 0) + 1;
const domainCounts = {};
for (const t of tasks) {
  domainCounts[t.domain] = domainCounts[t.domain] || { total: 0, byState: {} };
  domainCounts[t.domain].total++;
  domainCounts[t.domain].byState[t.state] = (domainCounts[t.domain].byState[t.state] || 0) + 1;
}
const rc1CriticalCounts = {};
for (const t of tasks) {
  if (!t.rc1Critical) continue;
  rc1CriticalCounts[t.state] = (rc1CriticalCounts[t.state] || 0) + 1;
}

// ---- DAG validation (independent recomputation, do not trust stored cycleCount) ----
const edges = depsDoc.edges;
const adj = new Map();
const danglingEdges = [];
for (const e of edges) {
  if (!byId.has(e.from) || !byId.has(e.to)) { danglingEdges.push(e); continue; }
  if (!adj.has(e.from)) adj.set(e.from, []);
  adj.get(e.from).push(e.to);
}

// Tarjan-ish DFS cycle detection (iterative to avoid stack overflow on 1600 nodes)
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
      if (c === WHITE) {
        color.set(child, GRAY);
        stack.push([child, 0]);
        pathStack.push(child);
      } else if (c === GRAY) {
        const cIdx = pathStack.indexOf(child);
        cycles.push(pathStack.slice(cIdx).concat(child));
      }
    } else {
      color.set(node, BLACK);
      stack.pop();
      pathStack.pop();
    }
  }
}

// Blocked-state cross-check: for each BLOCKED_BY_DEPENDENCY task, verify at least one predecessor is not DONE
const reverseAdj = new Map();
for (const e of edges) {
  if (!byId.has(e.from) || !byId.has(e.to)) continue;
  if (!reverseAdj.has(e.to)) reverseAdj.set(e.to, []);
  reverseAdj.get(e.to).push(e.from);
}
const staleDependencyBlocks = [];
const validDependencyBlocks = [];
for (const t of tasks) {
  if (t.state !== 'BLOCKED_BY_DEPENDENCY') continue;
  const preds = reverseAdj.get(t.id) || [];
  const unresolvedPreds = preds.filter(p => byId.get(p)?.state !== 'DONE');
  if (preds.length === 0 || unresolvedPreds.length === 0) {
    staleDependencyBlocks.push({ id: t.id, domain: t.domain, predecessors: preds, predecessorStates: preds.map(p => ({ id: p, state: byId.get(p)?.state })) });
  } else {
    validDependencyBlocks.push({ id: t.id, unresolvedCount: unresolvedPreds.length });
  }
}

// Non-dependency blocks (content/format/hardware/legal/owner gate) — these are preserved per mission rules
const gateBlocks = tasks.filter(t => ['BLOCKED_BY_CONTENT','BLOCKED_BY_FORMAT','BLOCKED_BY_HARDWARE','BLOCKED_BY_LEGAL','OWNER_GATE'].includes(t.state))
  .map(t => ({ id: t.id, domain: t.domain, state: t.state, gate: t.gate, blockedReason: t.blockedReason }));

const out = {
  generatedAt: tasksDoc.generatedAt,
  totalTasks: tasks.length,
  totalEdges: edges.length,
  danglingEdgeCount: danglingEdges.length,
  danglingEdges: danglingEdges.slice(0, 50),
  cycleCount: cycles.length,
  cycles: cycles.slice(0, 20),
  stateCounts,
  rc1CriticalStateCounts: rc1CriticalCounts,
  domainCounts,
  staleDependencyBlockCount: staleDependencyBlocks.length,
  staleDependencyBlocks,
  validDependencyBlockCount: validDependencyBlocks.length,
  gateBlockCount: gateBlocks.length,
  gateBlocksByState: gateBlocks.reduce((acc, g) => { acc[g.state] = (acc[g.state]||0)+1; return acc; }, {}),
};

fs.writeFileSync(path.join(RUNDIR, 'DAG-VALIDATION.json'), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(RUNDIR, 'TASK-STATE-COUNTS-BEFORE.json'), JSON.stringify({ stateCounts, domainCounts, rc1CriticalCounts, totalTasks: tasks.length }, null, 2));
fs.writeFileSync(path.join(RUNDIR, 'BLOCKED-TASK-AUDIT.json'), JSON.stringify({ staleDependencyBlocks, validDependencyBlockCount: validDependencyBlocks.length, gateBlocks }, null, 2));

console.log('OK');
console.log('stateCounts=', JSON.stringify(stateCounts));
console.log('cycleCount=', cycles.length, 'danglingEdgeCount=', danglingEdges.length);
console.log('staleDependencyBlockCount=', staleDependencyBlocks.length, 'validDependencyBlockCount=', validDependencyBlocks.length, 'gateBlockCount=', gateBlocks.length);
