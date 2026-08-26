#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
const tasksDoc = JSON.parse(fs.readFileSync('C:\\keyboard-manager-clean\\uaos-program-tree\\TASKS.json', 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

const BATCH = [
  'TASK-01-00097-ENTITLEMENTS_CONTRACT', 'TASK-01-00098-ENTITLEMENTS_IMPLEMENTATION', 'TASK-01-00099-ENTITLEMENTS_TESTS', 'TASK-01-00100-ENTITLEMENTS_EVIDENCE',
  'TASK-01-00165-EXPORT_IMPORT_USER_DATA_CONTRACT', 'TASK-01-00166-EXPORT_IMPORT_USER_DATA_IMPLEMENTATION', 'TASK-01-00167-EXPORT_IMPORT_USER_DATA_TESTS', 'TASK-01-00168-EXPORT_IMPORT_USER_DATA_EVIDENCE',
  'TASK-03-00337-INSPECTOR_CONTRACT', 'TASK-03-00338-INSPECTOR_IMPLEMENTATION', 'TASK-03-00339-INSPECTOR_TESTS', 'TASK-03-00340-INSPECTOR_EVIDENCE',
];

const ownership = BATCH.map(id => {
  const t = byId.get(id);
  return { taskId: id, productId: t.domain, epicId: t.epicId, worktree: t.worktree, ownerFile: t.ownerFile, allowedPaths: t.allowedPaths, forbiddenPaths: ['node_modules/**'], gate: t.gate };
});
const conflicts = [];
for (let i = 0; i < ownership.length; i++) for (let j = i + 1; j < ownership.length; j++) {
  if (ownership[i].worktree.toLowerCase() === ownership[j].worktree.toLowerCase()) conflicts.push([ownership[i].taskId, ownership[j].taskId]);
}
fs.writeFileSync(runDir + '/FILE-OWNERSHIP-PLAN.json', JSON.stringify({ generatedAt: new Date().toISOString(), tasks: ownership, worktreeConflicts: conflicts, conflictFree: conflicts.length === 0, allGatesNull: ownership.every(o => o.gate === null) }, null, 2));

const manifest = BATCH.map(id => {
  const t = byId.get(id);
  return { taskId: id, worktreePath: t.worktree, preexisting: fs.existsSync(t.worktree), ownerFile: t.ownerFile, testFile: (t.tests[0].match(/node --test (.+)$/) || [])[1], evidenceFile: t.evidence[0] };
});
fs.writeFileSync(runDir + '/WORKTREE-MANIFEST.json', JSON.stringify({ generatedAt: new Date().toISOString(), worktrees: manifest }, null, 2));
console.log('conflicts=', conflicts.length, 'allGatesNull=', ownership.every(o => o.gate === null));
