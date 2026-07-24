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
  return {
    ok: add.ok,
    worktreePath: wt,
    branch,
    head: info.head,
    stdout: add.stdout,
    stderr: add.stderr,
    exitCode: add.exitCode,
    ownerDirtyPreserved: info.isDirty
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
  const report = {
    ok: add.ok,
    worktreePath: wt,
    branch,
    head: info.head,
    createdAt: nowIso(),
    exitCode: add.exitCode,
    stderr: add.stderr
  };
  atomicWriteJson(path.join(resolveWorktreeRoot(), `${lane}-${taskId}.meta.json`), report);
  return report;
}
