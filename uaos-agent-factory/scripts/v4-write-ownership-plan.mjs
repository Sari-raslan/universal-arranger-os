#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const tasksDoc = JSON.parse(fs.readFileSync(TREE + '\\TASKS.json', 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

const BATCH = [
  'TASK-01-00057-SHARED_PROJECT_IDENTITY_CONTRACT', 'TASK-01-00058-SHARED_PROJECT_IDENTITY_IMPLEMENTATION', 'TASK-01-00059-SHARED_PROJECT_IDENTITY_TESTS', 'TASK-01-00060-SHARED_PROJECT_IDENTITY_EVIDENCE',
  'TASK-01-00073-RECOVERY_CONTRACT', 'TASK-01-00074-RECOVERY_IMPLEMENTATION', 'TASK-01-00075-RECOVERY_TESTS', 'TASK-01-00076-RECOVERY_EVIDENCE',
  'TASK-06-00653-PROJECT_SYSTEM_CONTRACT', 'TASK-06-00654-PROJECT_SYSTEM_IMPLEMENTATION', 'TASK-06-00655-PROJECT_SYSTEM_TESTS', 'TASK-06-00656-PROJECT_SYSTEM_EVIDENCE',
];

const ownership = BATCH.map(id => {
  const t = byId.get(id);
  return { taskId: id, productId: t.domain, epicId: t.epicId, worktree: t.worktree, ownerFile: t.ownerFile, allowedPaths: t.allowedPaths, forbiddenPaths: ['node_modules/**', ...tasksDoc.tasks.find(x => x.id === id).allowedPaths.map(() => null).filter(Boolean)] };
});

const conflicts = [];
for (let i = 0; i < ownership.length; i++) {
  for (let j = i + 1; j < ownership.length; j++) {
    if (ownership[i].worktree.toLowerCase() === ownership[j].worktree.toLowerCase()) conflicts.push([ownership[i].taskId, ownership[j].taskId]);
  }
}

fs.writeFileSync(runDir + '/FILE-OWNERSHIP-PLAN.json', JSON.stringify({ generatedAt: new Date().toISOString(), tasks: ownership, worktreeConflicts: conflicts, conflictFree: conflicts.length === 0 }, null, 2));

const manifest = BATCH.map(id => {
  const t = byId.get(id);
  return {
    taskId: id,
    worktreePath: t.worktree,
    preexisting: fs.existsSync(t.worktree),
    ownerFile: t.ownerFile,
    testFile: (t.tests[0].match(/node --test (.+)$/) || [])[1],
    evidenceFile: t.evidence[0],
    dependencies: [],
  };
});
fs.writeFileSync(runDir + '/WORKTREE-MANIFEST.json', JSON.stringify({ generatedAt: new Date().toISOString(), worktrees: manifest }, null, 2));

console.log('conflicts=', conflicts.length);
