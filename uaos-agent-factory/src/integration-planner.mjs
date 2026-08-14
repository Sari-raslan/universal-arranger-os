/**
 * Integration planning helpers for generic-runner.
 * Synthetic tests must use disposable D: repos — never real product integration history.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ensureDir, nowIso } from './lib.mjs';
import { resolveBuildRoot } from './paths.mjs';

/** Resolved lazily (not a module-load-time constant) so it respects
 * UAOS_FACTORY_BUILD_ROOT / UAOS_FACTORY_ROOT set after this module is
 * first imported, e.g. by a test harness. */
export function syntheticRepoRoot() {
  return path.join(resolveBuildRoot(), 'synthetic-repos');
}

function git(cwd, args, timeout = 60000) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', timeout, windowsHide: true });
  return {
    ok: (r.status ?? 1) === 0,
    status: r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim()
  };
}

export function revParse(cwd, ref = 'HEAD') {
  const r = git(cwd, ['rev-parse', ref]);
  return r.ok ? r.stdout : null;
}

export function isAncestor(cwd, maybeAncestor, descendant) {
  const r = git(cwd, ['merge-base', '--is-ancestor', maybeAncestor, descendant]);
  return r.ok;
}

/**
 * Create an isolated disposable git pair: integration + task worktree.
 * Never touches uaos-real-product or lane integration worktrees.
 */
export function createDisposableSyntheticRepos({
  stamp = nowIso().replace(/[:.]/g, '-'),
  taskId = 'L-SYN-GENERIC'
} = {}) {
  const syntheticRoot = syntheticRepoRoot();
  ensureDir(syntheticRoot);
  const root = path.join(syntheticRoot, `iso-${stamp}-${String(taskId).toLowerCase()}`);
  if (fs.existsSync(root)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  ensureDir(root);
  const integration = path.join(root, 'integration');
  const taskWt = path.join(root, 'task');
  const integrationBranch = 'factory/library-integration';
  const taskBranch = `factory/library-${String(taskId).toLowerCase()}`;

  git(root, ['init', integration]);
  fs.writeFileSync(path.join(integration, 'README.md'), `# disposable synthetic ${taskId}\n`, 'utf8');
  git(integration, ['add', 'README.md']);
  git(integration, [
    '-c',
    'user.email=uaos-factory@local',
    '-c',
    'user.name=UAOS Factory',
    'commit',
    '-m',
    'init'
  ]);
  git(integration, ['branch', '-M', integrationBranch]);
  const base = revParse(integration, 'HEAD');
  git(integration, ['branch', taskBranch, base]);
  git(integration, ['worktree', 'add', taskWt, taskBranch]);

  return {
    ok: true,
    root,
    integrationWorktree: integration,
    taskWorktree: taskWt,
    integrationBranch,
    taskBranch,
    taskBaseCommit: base,
    disposable: true
  };
}

/**
 * Plan how to integrate taskBranch into integrationBranch given taskBaseCommit.
 */
export function planIntegration({
  cwd,
  integrationBranch,
  taskBranch,
  taskBaseCommit,
  alreadyIntegrated = false
} = {}) {
  if (alreadyIntegrated) {
    return { action: 'ALREADY_INTEGRATED', ok: true };
  }
  if (!cwd || !fs.existsSync(cwd)) {
    return { action: 'INTEGRATION_WT_MISSING', ok: false };
  }
  if (!taskBaseCommit) {
    return { action: 'TASK_BASE_MISSING', ok: false, reason: 'TASK_BASE_MISSING' };
  }

  const integHead = revParse(cwd, integrationBranch) || revParse(cwd, 'HEAD');
  if (!integHead) {
    return { action: 'INTEGRATION_HEAD_MISSING', ok: false };
  }

  const taskHeadResult = git(cwd, ['rev-parse', taskBranch]);
  if (!taskHeadResult.ok) {
    return { action: 'TASK_BRANCH_MISSING', ok: false, reason: 'TASK_BRANCH_MISSING', taskBranch };
  }
  const resolvedTaskHead = taskHeadResult.stdout;

  if (!isAncestor(cwd, taskBaseCommit, resolvedTaskHead)) {
    return {
      action: 'STALE_OR_REWRITTEN_TASK_BASE',
      ok: false,
      reason: 'TASK_BASE_NOT_ANCESTOR_OF_TASK_HEAD',
      taskBaseCommit,
      taskHead: resolvedTaskHead
    };
  }

  if (integHead === resolvedTaskHead) {
    return { action: 'ALREADY_INTEGRATED', ok: true, integrationHead: integHead };
  }

  if (isAncestor(cwd, integHead, resolvedTaskHead)) {
    return {
      action: 'FAST_FORWARD',
      ok: true,
      integrationHead: integHead,
      taskHead: resolvedTaskHead,
      taskBaseCommit
    };
  }

  if (integHead !== taskBaseCommit && isAncestor(cwd, taskBaseCommit, integHead)) {
    return {
      action: 'INTEGRATION_HEAD_ADVANCED',
      ok: false,
      reason: 'INTEGRATION_HEAD_ADVANCED',
      taskBaseCommit,
      integrationHead: integHead,
      taskHead: resolvedTaskHead,
      preserveTaskWorktree: true
    };
  }

  return {
    action: 'DIVERGED',
    ok: false,
    reason: 'INTEGRATION_DIVERGED',
    taskBaseCommit,
    integrationHead: integHead,
    taskHead: resolvedTaskHead,
    preserveTaskWorktree: true
  };
}

/**
 * Execute planned integration. Never reset/rewrite owner history.
 */
export function executeIntegrationPlan(cwd, plan, { integrationBranch, taskBranch } = {}) {
  if (!plan || plan.action === 'ALREADY_INTEGRATED') {
    return { ok: true, action: plan?.action || 'ALREADY_INTEGRATED', skipped: true };
  }
  if (plan.action === 'FAST_FORWARD') {
    const co = git(cwd, ['checkout', integrationBranch]);
    if (!co.ok) return { ok: false, reason: 'CHECKOUT_FAIL', stderr: co.stderr };
    const merge = git(cwd, ['merge', '--ff-only', taskBranch]);
    if (!merge.ok) {
      return { ok: false, reason: 'FF_FAILED', stderr: merge.stderr, action: 'FAST_FORWARD' };
    }
    return {
      ok: true,
      action: 'FAST_FORWARD',
      integrationHead: revParse(cwd, 'HEAD'),
      stdout: merge.stdout
    };
  }
  return {
    ok: false,
    action: plan.action,
    reason: plan.reason || plan.action,
    preserveTaskWorktree: plan.preserveTaskWorktree !== false,
    integrationHead: plan.integrationHead,
    taskBaseCommit: plan.taskBaseCommit
  };
}

/**
 * When planIntegration reports INTEGRATION_HEAD_ADVANCED, attempt a safe, non-destructive
 * rebase of the task branch onto the new integration head, from inside the task's own
 * worktree (where the branch is already checked out — never touched from another worktree,
 * which git would refuse anyway). Only ever succeeds if the rebase applies with zero
 * conflicts; any conflict is cleanly aborted and the worktree is left exactly as it was.
 * Never force-pushes, never rewrites integrationBranch, never discards or reorders the
 * task's own commits.
 */
export function attemptSafeRebase(taskWorktree, { taskBranch, newBase } = {}) {
  if (!taskWorktree || !fs.existsSync(taskWorktree)) {
    return { ok: false, reason: 'TASK_WORKTREE_MISSING' };
  }
  if (!newBase) {
    return { ok: false, reason: 'NEW_BASE_MISSING' };
  }
  const currentBranch = git(taskWorktree, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!currentBranch.ok || (taskBranch && currentBranch.stdout !== taskBranch)) {
    // Refuse rather than guess if the worktree isn't sitting on the branch we think it is —
    // rebasing the wrong branch would silently rewrite the wrong history.
    return { ok: false, reason: 'TASK_WORKTREE_NOT_ON_TASK_BRANCH', found: currentBranch.stdout };
  }

  const preRebaseHead = revParse(taskWorktree, 'HEAD');
  if (preRebaseHead === newBase) {
    return { ok: false, reason: 'ALREADY_AT_NEW_BASE', taskBaseCommit: newBase };
  }

  // A clean rebase still creates new commit objects internally (each replayed commit is
  // re-committed onto the new base), so it needs an identity — same bot identity used for
  // every other Factory-authored commit — rather than depending on ambient global git config.
  const rebase = git(
    taskWorktree,
    ['-c', 'user.email=uaos-factory@local', '-c', 'user.name=UAOS Factory', 'rebase', newBase],
    120000
  );
  if (!rebase.ok) {
    git(taskWorktree, ['rebase', '--abort']);
    return { ok: false, reason: 'REBASE_CONFLICT', stderr: rebase.stderr, preRebaseHead };
  }

  const newTaskHead = revParse(taskWorktree, 'HEAD');
  return {
    ok: true,
    reason: 'REBASED_CLEAN',
    preRebaseHead,
    newTaskHead,
    taskBaseCommit: newBase
  };
}

export function recordTaskBaseCommit(patch, baseSha) {
  return {
    ...patch,
    taskBaseCommit: baseSha,
    claimedBaseAt: nowIso()
  };
}

/**
 * Bounded safe recreation of a missing integration worktree.
 * Never rewrites owner history. Returns ok:false when unsafe.
 */
export function tryRecreateIntegrationWorktree({
  repoRoot,
  integrationWorktree,
  integrationBranch
} = {}) {
  if (!repoRoot || !fs.existsSync(repoRoot)) {
    return { ok: false, reason: 'REPO_MISSING', remediation: `Ensure repo exists at ${repoRoot}` };
  }
  if (!integrationWorktree || !integrationBranch) {
    return { ok: false, reason: 'MISSING_ARGS' };
  }
  if (fs.existsSync(integrationWorktree)) {
    return { ok: false, reason: 'PATH_EXISTS_BUT_INVALID', path: integrationWorktree };
  }

  const branchOk = git(repoRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${integrationBranch}`]);
  if (!branchOk.ok) {
    return {
      ok: false,
      reason: 'INTEGRATION_BRANCH_MISSING',
      remediation: `Create branch ${integrationBranch} in ${repoRoot} without rewriting history`
    };
  }

  const list = git(repoRoot, ['worktree', 'list', '--porcelain']);
  if (list.stdout.includes(integrationWorktree.replace(/\\/g, '/')) || list.stdout.includes(integrationWorktree)) {
    return { ok: false, reason: 'WORKTREE_ALREADY_REGISTERED', path: integrationWorktree };
  }
  // Another worktree already checked out this branch?
  if (list.stdout.includes(`branch refs/heads/${integrationBranch}`)) {
    return {
      ok: false,
      reason: 'BRANCH_OWNED_BY_OTHER_WORKTREE',
      remediation: `Detach or remove the conflicting worktree for ${integrationBranch}`
    };
  }

  ensureDir(path.dirname(integrationWorktree));
  const add = git(repoRoot, ['worktree', 'add', integrationWorktree, integrationBranch], 180000);
  if (!add.ok) {
    return { ok: false, reason: 'WORKTREE_ADD_FAIL', stderr: add.stderr };
  }

  const head = revParse(integrationWorktree, 'HEAD');
  const branchHead = revParse(repoRoot, integrationBranch);
  if (!head || !branchHead || head !== branchHead) {
    return {
      ok: false,
      reason: 'RECREATED_HEAD_MISMATCH',
      head,
      branchHead,
      remediation: 'Do not force-reset; inspect worktree manually'
    };
  }

  return {
    ok: true,
    recreated: true,
    integrationWorktree,
    integrationBranch,
    head,
    at: nowIso()
  };
}

export { git as gitIn };
