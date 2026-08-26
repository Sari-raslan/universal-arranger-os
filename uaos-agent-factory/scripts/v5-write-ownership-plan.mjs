#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const tasksDoc = JSON.parse(fs.readFileSync(TREE + '\\TASKS.json', 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

const BATCH = [
  'TASK-01-00129-VERSIONING_CONTRACT', 'TASK-01-00130-VERSIONING_IMPLEMENTATION', 'TASK-01-00131-VERSIONING_TESTS', 'TASK-01-00132-VERSIONING_EVIDENCE',
  'TASK-01-00105-SIGNED_LICENSES_CONTRACT', 'TASK-01-00106-SIGNED_LICENSES_IMPLEMENTATION', 'TASK-01-00107-SIGNED_LICENSES_TESTS', 'TASK-01-00108-SIGNED_LICENSES_EVIDENCE',
  'TASK-02-00197-USER_SUPPLIED_WAV_INGESTION_CONTRACT', 'TASK-02-00198-USER_SUPPLIED_WAV_INGESTION_IMPLEMENTATI', 'TASK-02-00199-USER_SUPPLIED_WAV_INGESTION_TESTS', 'TASK-02-00200-USER_SUPPLIED_WAV_INGESTION_EVIDENCE',
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
  return { taskId: id, worktreePath: t.worktree, preexisting: fs.existsSync(t.worktree), ownerFile: t.ownerFile, testFile: (t.tests[0].match(/node --test (.+)$/) || [])[1], evidenceFile: t.evidence[0], dependencies: t.inputs || [] };
});
fs.writeFileSync(runDir + '/WORKTREE-MANIFEST.json', JSON.stringify({ generatedAt: new Date().toISOString(), worktrees: manifest }, null, 2));
console.log('conflicts=', conflicts.length, 'allGatesNull=', ownership.every(o => o.gate === null));
