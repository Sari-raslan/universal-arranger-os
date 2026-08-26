/**
 * UAOS V11 Cursor Leader — clean-baseline multi-agent orchestrator entry.
 * Hard-gates on commit 6cde73d inside C:\keyboard-manager-clean.
 * Does not mutate product WIP. Does not commit/push/merge/deploy.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = 'C:\\keyboard-manager-clean';
const REQUIRED = '6cde73d';
const COMMANDER = 'C:\\Users\\ssare\\Desktop\\UAOS Commander';

function git(cwd, args) {
  return spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
}

function main() {
  if (process.platform !== 'win32') {
    console.error('UAOS_V11_WINDOWS_REQUIRED');
    process.exit(2);
  }
  const inside = git(REPO, ['rev-parse', '--is-inside-work-tree']);
  if (inside.status !== 0 || String(inside.stdout).trim() !== 'true') {
    console.error('UAOS_V11_REPOSITORY_INVALID');
    process.exit(2);
  }
  const obj = git(REPO, ['cat-file', '-t', REQUIRED]);
  const has = obj.status === 0 && String(obj.stdout).trim() === 'commit';
  const head = String(git(REPO, ['rev-parse', 'HEAD']).stdout || '').trim();
  const branch = String(git(REPO, ['branch', '--show-current']).stdout || '').trim();
  const cmdObj = git(COMMANDER, ['cat-file', '-t', REQUIRED]);
  const commanderHas = cmdObj.status === 0 && String(cmdObj.stdout).trim() === 'commit';

  const reportDir = path.join(REPO, 'uaos-reports', 'latest');
  fs.mkdirSync(reportDir, { recursive: true });
  const payload = {
    coordinatorStatus: has ? 'UAOS_V11_BASELINE_OK' : 'UAOS_V11_BASELINE_COMMIT_NOT_FOUND',
    overallState: has ? 'UAOS_V11_READY_TO_ORCHESTRATE' : 'UAOS_V11_BASELINE_INTEGRITY_FAIL',
    repository: REPO,
    head,
    branch,
    requiredBaseline: REQUIRED,
    baselineFoundInRepo: has,
    baselineFoundInCommander: commanderHas,
    generatedAt: new Date().toISOString(),
    note: has
      ? 'Baseline present. Use Cursor chief orchestration to continue clean worktrees.'
      : 'Hard stop: do not create keyboard-manager-clean worktrees from missing commit. Protect dirty WIP.'
  };
  fs.writeFileSync(path.join(reportDir, 'LATEST-V11-LAUNCHER-STATUS.json'), JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));
  if (!has) {
    console.error('UAOS_V11_BASELINE_COMMIT_NOT_FOUND');
    process.exit(3);
  }
  console.log('UAOS_V11_BASELINE_OK');
}

main();