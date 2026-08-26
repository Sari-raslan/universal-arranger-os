#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
const tasksDoc = JSON.parse(fs.readFileSync('C:\\keyboard-manager-clean\\uaos-program-tree\\TASKS.json', 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));
const BATCH = [
  'TASK-01-00093-CAPABILITY_REGISTRY_CONTRACT', 'TASK-01-00094-CAPABILITY_REGISTRY_IMPLEMENTATION', 'TASK-01-00095-CAPABILITY_REGISTRY_TESTS', 'TASK-01-00096-CAPABILITY_REGISTRY_EVIDENCE',
  'TASK-01-00121-INSTALLER_PACKAGING_CONTRACT', 'TASK-01-00122-INSTALLER_PACKAGING_IMPLEMENTATION', 'TASK-01-00123-INSTALLER_PACKAGING_TESTS', 'TASK-01-00124-INSTALLER_PACKAGING_EVIDENCE',
  'TASK-05-00521-PROJECT_WORKSPACE_CONTRACT', 'TASK-05-00522-PROJECT_WORKSPACE_IMPLEMENTATION', 'TASK-05-00523-PROJECT_WORKSPACE_TESTS', 'TASK-05-00524-PROJECT_WORKSPACE_EVIDENCE',
];
const ownership = BATCH.map(id => { const t = byId.get(id); return { taskId: id, productId: t.domain, epicId: t.epicId, worktree: t.worktree, ownerFile: t.ownerFile, allowedPaths: t.allowedPaths, forbiddenPaths: ['node_modules/**'], gate: t.gate }; });
const conflicts = [];
for (let i = 0; i < ownership.length; i++) for (let j = i + 1; j < ownership.length; j++) if (ownership[i].worktree.toLowerCase() === ownership[j].worktree.toLowerCase()) conflicts.push([ownership[i].taskId, ownership[j].taskId]);
fs.writeFileSync(runDir + '/FILE-OWNERSHIP-PLAN.json', JSON.stringify({ generatedAt: new Date().toISOString(), tasks: ownership, worktreeConflicts: conflicts, conflictFree: conflicts.length === 0, allGatesNull: ownership.every(o => o.gate === null) }, null, 2));
const manifest = BATCH.map(id => { const t = byId.get(id); return { taskId: id, worktreePath: t.worktree, preexisting: fs.existsSync(t.worktree), ownerFile: t.ownerFile, testFile: (t.tests[0].match(/node --test (.+)$/) || [])[1], evidenceFile: t.evidence[0] }; });
fs.writeFileSync(runDir + '/WORKTREE-MANIFEST.json', JSON.stringify({ generatedAt: new Date().toISOString(), worktrees: manifest }, null, 2));
console.log('conflicts=', conflicts.length, 'allGatesNull=', ownership.every(o => o.gate === null));
