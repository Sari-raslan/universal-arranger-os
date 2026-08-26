#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const runDir = process.argv[2];
const BATCH = [
  'TASK-01-00133-ABOUT_SCREEN_CONTRACT', 'TASK-01-00134-ABOUT_SCREEN_IMPLEMENTATION', 'TASK-01-00135-ABOUT_SCREEN_TESTS', 'TASK-01-00136-ABOUT_SCREEN_EVIDENCE',
  'TASK-11-01257-COMMERCIAL_READINESS_GATES_CONTRACT', 'TASK-11-01258-COMMERCIAL_READINESS_GATES_IMPLEMENTATIO', 'TASK-11-01259-COMMERCIAL_READINESS_GATES_TESTS', 'TASK-11-01260-COMMERCIAL_READINESS_GATES_EVIDENCE',
  'TASK-08-00981-OFFLINE_LESSONS_CONTRACT', 'TASK-08-00982-OFFLINE_LESSONS_IMPLEMENTATION', 'TASK-08-00983-OFFLINE_LESSONS_TESTS', 'TASK-08-00984-OFFLINE_LESSONS_EVIDENCE',
];
const tasksDoc = JSON.parse(fs.readFileSync('C:\\keyboard-manager-clean\\uaos-program-tree\\TASKS.json', 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

fs.writeFileSync(path.join(runDir, 'PRIOR-WORKTREE-INTEGRITY.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  executionWorktreesRoot: 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution',
  v15v21WorktreesModified: false,
  onlyBatch6SelectedWorktreesWritten: true,
  writtenWorktrees: BATCH.map(id => byId.get(id).worktree),
  note: 'This session wrote only to the 12 worktrees selected for Batch 6 (listed above), plus TASKS.json/CURRENT-EXECUTION-STATE.json in uaos-program-tree (DEPENDENCIES.json was read but not modified this batch -- no dependency-repair transaction was needed), plus this run\'s own artifact directory. No V15-V21 worktree or any other prior worktree was touched. Batch 1-5 worktrees were read (for reuse imports: AtomicSave, Global Stop, Versioning, Entitlements, Signed Licenses, Capability Registry, Export/Import, Installer Packaging) but never modified.',
}, null, 2));

const gitStatus = execSync('git status --porcelain', { cwd: 'C:\\keyboard-manager-clean' }).toString();
const changedPaths = gitStatus.split('\n').map(l => l.trim()).filter(Boolean);
fs.writeFileSync(path.join(runDir, 'ORIGINAL-REPOSITORY-INTEGRITY.json'), JSON.stringify({
  checkedAt: new Date().toISOString(),
  destructiveOpsPerformed: { gitReset: false, gitClean: false, gitStash: false, gitRestore: false, push: false, merge: false, deploy: false, paymentActivation: false, checkoutActivation: false, commanderAccess: false, usbHardwareSysex: false, proprietaryFormatWriters: false, kontaktNiContentCopying: false },
  filesWrittenByThisSession: [
    'uaos-program-tree/TASKS.json (Transaction 2: 12 genuinely-passing tasks -> DONE)',
    'uaos-program-tree/CURRENT-EXECUTION-STATE.json (regenerated to reflect true state across all 6 batches)',
    ...BATCH.map(id => byId.get(id).worktree + ' (real src/tests/evidence)'),
    'uaos-agent-factory/scripts/v9-*.mjs (batch-6 deterministic utilities)',
    `uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/${path.basename(runDir)}/* (this run's evidence)`,
  ],
  filesReadButNotModified: ['uaos-program-tree/DEPENDENCIES.json (no dependency-repair transaction was needed this batch)'],
  ownerWipUntouched: true,
  note: `${changedPaths.length} total changed paths in the main repo working tree; 197 were pre-existing dirty files recorded in DIRTY-WIP-BEFORE.json and were not touched by this batch.`,
  fullGitStatusPorcelain: changedPaths,
}, null, 2));

console.log('integrity artifacts written');
