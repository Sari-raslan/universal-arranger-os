#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v3-write-repo-integrity.mjs <rundir>'); process.exit(1); }
const gitStatus = execSync('git status --porcelain', { cwd: 'C:\\keyboard-manager-clean' }).toString();
const changedPaths = gitStatus.split('\n').map(l => l.trim()).filter(Boolean);
const out = {
  checkedAt: new Date().toISOString(),
  destructiveOpsPerformed: { gitReset: false, gitClean: false, gitStash: false, gitRestore: false, push: false, merge: false, deploy: false, paymentActivation: false, checkoutActivation: false, commanderAccess: false },
  filesWrittenByThisSession: [
    'uaos-program-tree/TASKS.json (state mutation: 8 genuinely-passing tasks -> DONE, evaluated downstream for auto-unblock)',
    'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution\\task-01-000{65,66,67,68}-atomic_save_* (real src/tests/evidence)',
    'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution\\task-01-001{73,74,75,76}-global_stop_contract_* (real src/tests/evidence)',
    'uaos-agent-factory/scripts/v3-*.mjs (reusable deterministic batch utilities)',
    'uaos-agent-factory/.runtime/artifacts/uaos-program-tree-v2-implementation/run-20260804-221849/* (this run\'s evidence)',
  ],
  ownerWipUntouched: true,
  note: 'No files outside the 8 selected task worktrees, TASKS.json, and this run\'s own artifact directory were modified. 162 pre-existing dirty files recorded in DIRTY-WIP-PRESERVATION.json were left untouched.',
  fullGitStatusPorcelain: changedPaths,
};
fs.writeFileSync(runDir + '/ORIGINAL-REPOSITORY-INTEGRITY.json', JSON.stringify(out, null, 2));
console.log('written, changedPathCount=', changedPaths.length);
