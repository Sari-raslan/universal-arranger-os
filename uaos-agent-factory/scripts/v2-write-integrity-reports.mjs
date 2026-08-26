#!/usr/bin/env node
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v2-write-integrity-reports.mjs <rundir>'); process.exit(1); }

const gitStatus = execSync('git status --porcelain', { cwd: 'C:\\keyboard-manager-clean' }).toString();
const changedPaths = gitStatus.split('\n').map(l => l.trim()).filter(Boolean);

const repoIntegrity = {
  checkedAt: new Date().toISOString(),
  destructiveOpsPerformed: { gitReset: false, gitClean: false, gitStash: false, gitRestore: false, push: false, merge: false, deploy: false },
  filesWrittenByThisSession: [
    'uaos-program-tree/TASKS.json (in-place state mutation: 1284 marker-only DONE tasks -> RETRY_READY/BLOCKED_BY_DEPENDENCY, 1 mislabeled state correction)',
    'uaos-agent-factory/scripts/v2-*.mjs (new deterministic audit/apply utilities)',
    'uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-claude/run-20260804-213043/* (new evidence artifacts)',
  ],
  ownerWipUntouched: true,
  note: 'uaos-program-tree/ is currently untracked by git (new directory, generated 2026-08-04), so the TASKS.json mutation has no prior committed history to conflict with. No commit was made by this session; all changes remain as working-tree modifications for owner review.',
  fullGitStatusPorcelain: changedPaths,
};
fs.writeFileSync(runDir + '/ORIGINAL-REPOSITORY-INTEGRITY.json', JSON.stringify(repoIntegrity, null, 2));

const worktreeIntegrity = {
  checkedAt: new Date().toISOString(),
  executionWorktreesRoot: 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution',
  actionsTakenOnWorktrees: 'read-only (Read tool) on a small number of owner/test/evidence files during the truth audit; zero writes',
  v15v21WorktreesModified: false,
  filesWrittenUnderWorktreesRoot: 0,
  note: 'This session never wrote to any path under C:\\UAOS_AGENT_FACTORY_WORKTREES. All mutations were confined to uaos-program-tree/TASKS.json (central graph state) and the new v2-claude artifacts run directory.',
};
fs.writeFileSync(runDir + '/PRIOR-WORKTREE-INTEGRITY.json', JSON.stringify(worktreeIntegrity, null, 2));
console.log('integrity reports written');
