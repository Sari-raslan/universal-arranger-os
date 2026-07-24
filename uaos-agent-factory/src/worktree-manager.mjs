import fs from 'node:fs';
import path from 'node:path';
import {
  loadFactoryConfig,
  ensureDir,
  runCmd,
  gitInfo,
  nowIso,
  atomicWriteJson
} from './lib.mjs';
import { resolveWorktreeRoot } from './paths.mjs';
import { resolveLaneRepository } from './lane-repositories.mjs';
import { isValidTaskIdFormat } from './queue-manager.mjs';

export function worktreePathFor(lane, taskId) {
  if (!isValidTaskIdFormat(taskId)) {
    throw new Error(`Refusing to build a worktree path for a malformed taskId: ${JSON.stringify(taskId)}`);
  }
  return path.join(resolveWorktreeRoot(), `${lane}-${String(taskId).toLowerCase()}`);
}

/** `git worktree add` exiting 0 is not proof the worktree is immediately
 * usable on every filesystem - retry HEAD resolution briefly before
 * declaring the worktree broken. */
function verifyWorktreeReady(wt, { attempts = 3, backoffMs = 100 } = {}) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    last = runCmd('git rev-parse HEAD', { cwd: wt });
    if (last.ok) return last;
    const end = Date.now() + backoffMs;
    while (Date.now() < end) {
      /* brief backoff for filesystem/worktree-metadata propagation */
    }
  }
  return last;
}

export function createIntegrationWorktree(lane) {
  const cfg = loadFactoryConfig();
  const resolved = resolveLaneRepository(lane);
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason, lane };
  }
  const repo = resolved.path;
  const info = gitInfo(repo);
  if (!info.exists) {
    return { ok: false, reason: 'repo_missing', repo };
  }

  const branch = cfg.lanes[lane].integrationBranch;
  const worktreeRoot = resolveWorktreeRoot();
  const wt = path.join(worktreeRoot, `${lane}-integration`);
  ensureDir(worktreeRoot);

  const existing = runCmd(`git worktree list --porcelain`, { cwd: repo });
  if (existing.stdout.includes(wt.replace(/\\/g, '/')) || existing.stdout.includes(wt)) {
    return { ok: true, alreadyExists: true, worktreePath: wt, branch, head: info.head };
  }

  // Create branch from current HEAD without touching dirty owner tree
  const branchExists = runCmd(`git show-ref --verify --quiet refs/heads/${branch}`, { cwd: repo });
  if (!branchExists.ok) {
    runCmd(`git branch ${branch} ${info.head}`, { cwd: repo });
  }

  if (fs.existsSync(wt)) {
    return { ok: true, alreadyExists: true, worktreePath: wt, branch, head: info.head, note: 'path_exists' };
  }

  const add = runCmd(`git worktree add "${wt}" ${branch}`, { cwd: repo, timeout: 180000 });
  // `git worktree add` reporting a clean exit is not proof the worktree is
  // actually usable yet - verify HEAD resolves in the new location before
  // declaring success, so a caller never proceeds against a broken worktree.
  const verify = add.ok ? verifyWorktreeReady(wt) : null;
  return {
    ok: add.ok && !!verify?.ok,
    worktreePath: wt,
    branch,
    head: info.head,
    stdout: add.stdout,
    stderr: add.stderr,
    exitCode: add.exitCode,
    ownerDirtyPreserved: info.isDirty,
    verifyStderr: verify && !verify.ok ? verify.stderr : undefined
  };
}

export function createTaskWorktree(lane, taskId) {
  const resolved = resolveLaneRepository(lane);
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason, lane, taskId };
  }
  const repo = resolved.path;
  const info = gitInfo(repo);
  const branch = `factory/${lane}-${taskId.toLowerCase()}`;
  const wt = worktreePathFor(lane, taskId);
  ensureDir(resolveWorktreeRoot());

  if (fs.existsSync(wt)) {
    return { ok: true, alreadyExists: true, worktreePath: wt, branch };
  }

  const branchExists = runCmd(`git show-ref --verify --quiet refs/heads/${branch}`, { cwd: repo });
  if (!branchExists.ok) {
    runCmd(`git branch ${branch} ${info.head}`, { cwd: repo });
  }

  const add = runCmd(`git worktree add "${wt}" ${branch}`, { cwd: repo, timeout: 180000 });
  const verify = add.ok ? verifyWorktreeReady(wt) : null;
  const report = {
    ok: add.ok && !!verify?.ok,
    worktreePath: wt,
    branch,
    head: info.head,
    createdAt: nowIso(),
    exitCode: add.exitCode,
    stderr: add.stderr,
    verifyStderr: verify && !verify.ok ? verify.stderr : undefined
  };
  atomicWriteJson(path.join(resolveWorktreeRoot(), `${lane}-${taskId}.meta.json`), report);
  return report;
}
