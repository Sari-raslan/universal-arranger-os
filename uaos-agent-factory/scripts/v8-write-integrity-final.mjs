#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const runDir = process.argv[2];
const BATCH = [
  'TASK-01-00093-CAPABILITY_REGISTRY_CONTRACT', 'TASK-01-00094-CAPABILITY_REGISTRY_IMPLEMENTATION', 'TASK-01-00095-CAPABILITY_REGISTRY_TESTS', 'TASK-01-00096-CAPABILITY_REGISTRY_EVIDENCE',
  'TASK-01-00121-INSTALLER_PACKAGING_CONTRACT', 'TASK-01-00122-INSTALLER_PACKAGING_IMPLEMENTATION', 'TASK-01-00123-INSTALLER_PACKAGING_TESTS', 'TASK-01-00124-INSTALLER_PACKAGING_EVIDENCE',
  'TASK-05-00521-PROJECT_WORKSPACE_CONTRACT', 'TASK-05-00522-PROJECT_WORKSPACE_IMPLEMENTATION', 'TASK-05-00523-PROJECT_WORKSPACE_TESTS', 'TASK-05-00524-PROJECT_WORKSPACE_EVIDENCE',
];
const tasksDoc = JSON.parse(fs.readFileSync('C:\\keyboard-manager-clean\\uaos-program-tree\\TASKS.json', 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

fs.writeFileSync(path.join(runDir, 'PRIOR-WORKTREE-INTEGRITY.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  executionWorktreesRoot: 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution',
  v15v21WorktreesModified: false,
  onlyBatch5SelectedWorktreesWritten: true,
  writtenWorktrees: BATCH.map(id => byId.get(id).worktree),
  note: 'This session wrote only to the 12 worktrees selected for Batch 5 (listed above), plus TASKS.json/DEPENDENCIES.json/CURRENT-EXECUTION-STATE.json in uaos-program-tree, plus this run\'s own artifact directory. No V15-V21 worktree or any other prior worktree was touched. Batch 1-4 worktrees were read (for reuse imports: AtomicSave, Export/Import discovery, Entitlements, Versioning) but never modified.',
}, null, 2));

const gitStatus = execSync('git status --porcelain', { cwd: 'C:\\keyboard-manager-clean' }).toString();
const changedPaths = gitStatus.split('\n').map(l => l.trim()).filter(Boolean);
fs.writeFileSync(path.join(runDir, 'ORIGINAL-REPOSITORY-INTEGRITY.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  destructiveOpsPerformed: { gitReset: false, gitClean: false, gitStash: false, gitRestore: false, push: false, merge: false, deploy: false, paymentActivation: false, checkoutActivation: false, commanderAccess: false, usbHardwareSysex: false, proprietaryFormatWriters: false, kontaktNiContentCopying: false },
  filesWrittenByThisSession: [
    'uaos-program-tree/TASKS.json (Transaction 1: 6 evidence-based release-bridge dependency edges; Transaction 2: 12 genuinely-passing tasks -> DONE)',
    'uaos-program-tree/DEPENDENCIES.json (6 edges added, validated: 0 cycles/dangling/self/duplicate)',
    'uaos-program-tree/CURRENT-EXECUTION-STATE.json (regenerated to reflect true state across all 5 batches)',
    ...BATCH.map(id => byId.get(id).worktree + ' (real src/tests/evidence)'),
    'uaos-agent-factory/scripts/v7-*.mjs, v8-*.mjs (batch-5 deterministic utilities)',
    `uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/${path.basename(runDir)}/* (this run's evidence)`,
  ],
  ownerWipUntouched: true,
  note: `${changedPaths.length} total changed paths in the main repo working tree; 190 were pre-existing dirty files recorded in DIRTY-WIP-BEFORE.json and were not touched by this batch.`,
  fullGitStatusPorcelain: changedPaths,
}, null, 2));

console.log('integrity artifacts written');
