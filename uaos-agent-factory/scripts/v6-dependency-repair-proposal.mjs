#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const WORKTREES_ROOT = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution';
const runDir = process.argv[2];

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const depsDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'DEPENDENCIES.json'), 'utf8'));
const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));
const worktreeDirNameToTaskId = new Map();
for (const t of tasks) {
  const dirName = path.basename(t.worktree);
  worktreeDirNameToTaskId.set(dirName, t.id);
}

const doneTasks = tasks.filter(t => t.state === 'DONE');
const existingEdgeKeys = new Set(depsDoc.edges.map(e => e.from + '->' + e.to));

const proposedEdges = [];
const evidenceLog = [];

for (const t of doneTasks) {
  let src;
  try {
    src = fs.readFileSync(t.ownerFile, 'utf8');
  } catch { continue; }
  // Match relative imports that climb out to a sibling task worktree directory:
  // e.g. `from '../../task-01-00066-atomic_save_implementation/src/...'`
  const importRe = /from\s+['"]\.\.\/\.\.\/(task-[a-z0-9_-]+)\//g;
  let m;
  const referencedDirs = new Set();
  while ((m = importRe.exec(src))) referencedDirs.add(m[1]);
  for (const dirName of referencedDirs) {
    const predecessorTaskId = worktreeDirNameToTaskId.get(dirName);
    if (!predecessorTaskId) continue;
    if (predecessorTaskId === t.id) continue; // self
    const edgeKey = predecessorTaskId + '->' + t.id;
    if (existingEdgeKeys.has(edgeKey)) continue; // already encoded
    evidenceLog.push({ from: predecessorTaskId, to: t.id, evidence: `${t.id}'s ownerFile (${path.basename(t.ownerFile)}) contains a static relative import reaching into ${dirName}/src/, i.e. real production code depends on that module.`, criterion: '#6 required artifact from the predecessor' });
    proposedEdges.push({ from: predecessorTaskId, to: t.id, type: 'BLOCKS' });
  }
}

// Dedup proposed edges (a task may import the same predecessor from multiple lines).
const seen = new Set();
const dedupedEdges = proposedEdges.filter(e => {
  const k = e.from + '->' + e.to;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

// Validate: no self-deps, no duplicates vs existing, no dangling (both endpoints exist), and confirm both endpoints are DONE (so this is purely a documentation/correctness repair, not a live-unblocking one for tasks that don't exist yet).
const validation = dedupedEdges.map(e => ({
  ...e,
  fromExists: byId.has(e.from),
  toExists: byId.has(e.to),
  fromState: byId.get(e.from)?.state,
  toState: byId.get(e.to)?.state,
  isSelfDep: e.from === e.to,
}));

const proposal = {
  generatedAt: new Date().toISOString(),
  method: 'Static analysis of every currently-DONE task\'s real production ownerFile source, grepping for relative imports of the form `from \'../../task-XXX/src/...\'` that reach into a sibling capability\'s worktree. Each match is objectively verifiable (grep-reproducible) evidence of criterion #6 (required artifact from the predecessor) from the repair rules. This deliberately does NOT infer any edge from task titles/topic similarity alone, per the mission\'s explicit prohibition.',
  scopeNote: 'This proposal is intentionally narrow: it only adds edges between tasks that are ALREADY DONE (batches 1-3), so applying it corrects the graph\'s documented architecture without unblocking/reblocking anything currently in flight. It does not attempt to retroactively invent edges for the 313 not-yet-implemented READY tasks, since no comparable objective evidence (real source imports) can exist for code that has not been written yet.',
  candidateEdgeCount: dedupedEdges.length,
  candidateEdges: validation,
  allEndpointsDone: validation.every(e => e.fromState === 'DONE' && e.toState === 'DONE'),
  allEndpointsExist: validation.every(e => e.fromExists && e.toExists),
  noSelfDeps: validation.every(e => !e.isSelfDep),
  evidenceLog,
};

fs.writeFileSync(path.join(runDir, 'DEPENDENCY-REPAIR-PROPOSAL.json'), JSON.stringify(proposal, null, 2));
console.log('candidateEdgeCount=', dedupedEdges.length);
console.log(JSON.stringify(validation, null, 2));
