#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const depsDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'DEPENDENCIES.json'), 'utf8'));
const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));

const reverseAdj = new Map();
for (const e of depsDoc.edges) {
  if (!byId.has(e.from) || !byId.has(e.to)) continue;
  if (!reverseAdj.has(e.to)) reverseAdj.set(e.to, []);
  reverseAdj.get(e.to).push(e.from);
}

const before = {};
for (const t of tasks) before[t.state] = (before[t.state] || 0) + 1;

const now = new Date().toISOString();
const changed = [];
for (const t of tasks) {
  if (t.state !== 'BLOCKED_BY_DEPENDENCY') continue;
  const preds = reverseAdj.get(t.id) || [];
  if (preds.length > 0 && preds.every(p => byId.get(p)?.state === 'DONE')) {
    t.state = 'RETRY_READY';
    t.blockedReason = null;
    t.updatedAt = now;
    changed.push(t.id);
  }
}

fs.writeFileSync(path.join(TREE, 'TASKS.json'), JSON.stringify(tasksDoc, null, 2));

const after = {};
for (const t of tasks) after[t.state] = (after[t.state] || 0) + 1;

fs.writeFileSync(path.join(runDir, 'STATE-RECALCULATION-AFTER-DEPENDENCY-REPAIR.json'), JSON.stringify({
  generatedAt: now,
  reasonForRecalc: 'Applied 8 evidence-based dependency edges (all between already-DONE tasks); recomputing state to confirm this repair changes ZERO task states, as expected (both endpoints of every added edge were already DONE before the repair).',
  before, after,
  tasksChangedByThisRecalc: changed,
  expectedZeroChange: changed.length === 0,
}, null, 2));

console.log('changed=', changed.length, '(expected 0)');
console.log('before=', JSON.stringify(before));
console.log('after=', JSON.stringify(after));
