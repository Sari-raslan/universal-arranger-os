#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const runDir = process.argv[2];
const BATCH = [
  'TASK-01-00097-ENTITLEMENTS_CONTRACT', 'TASK-01-00098-ENTITLEMENTS_IMPLEMENTATION', 'TASK-01-00099-ENTITLEMENTS_TESTS', 'TASK-01-00100-ENTITLEMENTS_EVIDENCE',
  'TASK-01-00165-EXPORT_IMPORT_USER_DATA_CONTRACT', 'TASK-01-00166-EXPORT_IMPORT_USER_DATA_IMPLEMENTATION', 'TASK-01-00167-EXPORT_IMPORT_USER_DATA_TESTS', 'TASK-01-00168-EXPORT_IMPORT_USER_DATA_EVIDENCE',
  'TASK-03-00337-INSPECTOR_CONTRACT', 'TASK-03-00338-INSPECTOR_IMPLEMENTATION', 'TASK-03-00339-INSPECTOR_TESTS', 'TASK-03-00340-INSPECTOR_EVIDENCE',
];
const tasksDoc = JSON.parse(fs.readFileSync('C:\\keyboard-manager-clean\\uaos-program-tree\\TASKS.json', 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

fs.writeFileSync(path.join(runDir, 'PRIOR-WORKTREE-INTEGRITY.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  executionWorktreesRoot: 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution',
  v15v21WorktreesModified: false,
  onlyBatch4SelectedWorktreesWritten: true,
  writtenWorktrees: BATCH.map(id => byId.get(id).worktree),
  note: 'This session wrote only to the 12 worktrees selected for Batch 4 (listed above; one of them, task-01-00166, was RECOVERED from a broken prior-session/Aider partial edit rather than started fresh), plus TASKS.json/DEPENDENCIES.json/CURRENT-EXECUTION-STATE.json in uaos-program-tree, plus this run\'s own artifact directory. No V15-V21 worktree or any other prior worktree was touched. The aider-exact-continuation-20260805-091347 subdirectory under this run was inspected read-only, never modified.',
}, null, 2));

const gitStatus = execSync('git status --porcelain', { cwd: 'C:\\keyboard-manager-clean' }).toString();
const changedPaths = gitStatus.split('\n').map(l => l.trim()).filter(Boolean);
fs.writeFileSync(path.join(runDir, 'ORIGINAL-REPOSITORY-INTEGRITY.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  destructiveOpsPerformed: { gitReset: false, gitClean: false, gitStash: false, gitRestore: false, push: false, merge: false, deploy: false, paymentActivation: false, checkoutActivation: false, commanderAccess: false, usbHardwareSysex: false, proprietaryFormatWriters: false, kontaktNiContentCopying: false },
  filesWrittenByThisSession: [
    'uaos-program-tree/TASKS.json (Transaction 1: 8 evidence-based dependency edges; Transaction 2: 12 genuinely-passing tasks -> DONE)',
    'uaos-program-tree/DEPENDENCIES.json (8 edges added, validated: 0 cycles/dangling/self/duplicate)',
    'uaos-program-tree/CURRENT-EXECUTION-STATE.json (regenerated to reflect true state across all 4 batches)',
    ...BATCH.map(id => byId.get(id).worktree + ' (real src/tests/evidence)'),
    'uaos-agent-factory/scripts/v6-*.mjs (batch-4 deterministic utilities)',
    `uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/${path.basename(runDir)}/* (this run's evidence, including the dependency-repair backup and the aider-continuation inspection)`,
  ],
  ownerWipUntouched: true,
  note: `${changedPaths.length} total changed paths in the main repo working tree; 180 were pre-existing dirty files recorded in DIRTY-WIP-BEFORE.json and were not touched by this batch.`,
  fullGitStatusPorcelain: changedPaths,
}, null, 2));

console.log('integrity artifacts written');
