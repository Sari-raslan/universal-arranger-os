#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];

const proposal = JSON.parse(fs.readFileSync(path.join(runDir, 'DEPENDENCY-REPAIR-PROPOSAL.json'), 'utf8'));
const depsPath = path.join(TREE, 'DEPENDENCIES.json');
const depsDoc = JSON.parse(fs.readFileSync(depsPath, 'utf8'));
const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

const before = { edgeCount: depsDoc.edges.length };

const existingKeys = new Set(depsDoc.edges.map(e => e.from + '->' + e.to));
const applied = [];
for (const cand of proposal.candidateEdges) {
  const key = cand.from + '->' + cand.to;
  if (existingKeys.has(key)) continue;
  if (cand.isSelfDep) continue;
  if (!byId.has(cand.from) || !byId.has(cand.to)) continue;
  depsDoc.edges.push({ from: cand.from, to: cand.to, type: 'BLOCKS' });
  existingKeys.add(key);
  applied.push({ from: cand.from, to: cand.to });
}

// --- Validate the PATCHED graph before writing: cycles, dangling, self, duplicates ---
const adj = new Map();
const danglingEdges = [];
const selfDeps = [];
const edgeKeyCounts = new Map();
for (const e of depsDoc.edges) {
  if (e.from === e.to) selfDeps.push(e);
  const k = e.from + '->' + e.to;
  edgeKeyCounts.set(k, (edgeKeyCounts.get(k) || 0) + 1);
  if (!byId.has(e.from) || !byId.has(e.to)) { danglingEdges.push(e); continue; }
  if (!adj.has(e.from)) adj.set(e.from, []);
  adj.get(e.from).push(e.to);
}
const duplicateEdges = [...edgeKeyCounts.entries()].filter(([, c]) => c > 1);

const WHITE = 0, GRAY = 1, BLACK = 2;
const color = new Map(tasksDoc.tasks.map(t => [t.id, WHITE]));
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

const validationPassed = cycles.length === 0 && danglingEdges.length === 0 && selfDeps.length === 0 && duplicateEdges.length === 0;

if (!validationPassed) {
  console.error('VALIDATION FAILED — not writing DEPENDENCIES.json', { cycles: cycles.length, dangling: danglingEdges.length, selfDeps: selfDeps.length, duplicates: duplicateEdges.length });
  process.exit(1);
}

fs.writeFileSync(depsPath, JSON.stringify(depsDoc, null, 2));

const after = { edgeCount: depsDoc.edges.length };

fs.writeFileSync(path.join(runDir, 'DEPENDENCY-REPAIR-APPLIED.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  status: applied.length > 0 ? 'REPAIR_APPLIED' : 'NO_REPAIR_REQUIRED',
  appliedEdgeCount: applied.length,
  appliedEdges: applied,
  postApplyValidation: { cycles: cycles.length, danglingEdges: danglingEdges.length, selfDependencies: selfDeps.length, duplicateEdges: duplicateEdges.length, validationPassed },
}, null, 2));

fs.writeFileSync(path.join(runDir, 'DEPENDENCY-EDGE-COUNTS-BEFORE-AFTER.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), before, after, delta: after.edgeCount - before.edgeCount,
}, null, 2));

console.log('applied=', applied.length, 'before=', before.edgeCount, 'after=', after.edgeCount, 'validationPassed=', validationPassed);
