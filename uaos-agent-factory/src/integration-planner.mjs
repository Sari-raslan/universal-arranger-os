/**
 * Integration planning helpers for generic-runner.
 * Synthetic tests must use disposable D: repos — never real product integration history.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ensureDir, nowIso } from './lib.mjs';

export const SYNTHETIC_REPO_ROOT = 'D:\\UAOS_AGENT_FACTORY_BUILD\\synthetic-repos';

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
  ensureDir(SYNTHETIC_REPO_ROOT);
  const root = path.join(SYNTHETIC_REPO_ROOT, `iso-${stamp}-${String(taskId).toLowerCase()}`);
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

export function recordTaskBaseCommit(patch, baseSha) {
  return {
    ...patch,
    taskBaseCommit: baseSha,
    claimedBaseAt: nowIso()
  };
}

export { git as gitIn };
