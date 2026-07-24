import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  FACTORY_ROOT,
  nowIso,
  ensureDir,
  atomicWriteJson,
  readJson,
  runCmd,
  loadFactoryConfig
} from './lib.mjs';
import { getTask, updateTask } from './queue-manager.mjs';
import { worktreePathFor } from './worktree-manager.mjs';
import { loadActiveWriters, saveActiveWriters } from './dispatch.mjs';
import {
  isTerminalSuccessStatus,
  isWriterAuthBlocked,
  isAwaitingRunner,
  WRITER_BLOCKED_REASONS,
  AWAITING_RUNNER_REASONS
} from './retry-policy.mjs';
import { writeMasterStatus } from './reporter.mjs';
import { resolveArtifactRoot, resolveWorktreeRoot } from './paths.mjs';

const CLAIMS_PATH = path.join(FACTORY_ROOT, 'state', 'cursor-local-claims.json');

export const CURSOR_LOCAL_EXECUTOR = 'cursor-local';
export const CURSOR_LOCAL_MODE = 'interactive_cursor_agent';

const CLAIMABLE_STATUSES = new Set(['ready', 'blocked', 'retry', 'interrupted', 'pending']);

function loadClaims() {
  return readJson(CLAIMS_PATH, { updatedAt: null, claims: {} });
}

function saveClaims(data) {
  data.updatedAt = nowIso();
  atomicWriteJson(CLAIMS_PATH, data);
  return data;
}

function claimKey(lane, taskId) {
  return `${lane}:${taskId}`;
}

export function isWriterUnavailabilityBlocker(task) {
  const reason = task?.blockingReason || task?.result?.reason || task?.result?.blockingReason;
  return (
    WRITER_BLOCKED_REASONS.has(reason)
    || AWAITING_RUNNER_REASONS.has(reason)
    || reason === 'WAITING_HEAVY_WRITER_SLOT'
    || reason === 'OWNER_RESUME'
    || reason === 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI'
  );
}

export function canClaimWithCursorLocal(task) {
  if (!task) return { ok: false, reason: 'NO_TASK' };
  if (isTerminalSuccessStatus(task.status)) {
    return { ok: false, reason: 'ALREADY_COMPLETE', status: task.status };
  }
  if (task.status === 'running' && task.executionMode === CURSOR_LOCAL_MODE) {
    return { ok: false, reason: 'ALREADY_CLAIMED', claimId: task.claimId };
  }
  if (task.status === 'running') {
    return { ok: false, reason: 'ALREADY_RUNNING' };
  }
  if (!CLAIMABLE_STATUSES.has(task.status)) {
    return { ok: false, reason: 'STATUS_NOT_CLAIMABLE', status: task.status };
  }
  if (task.status === 'blocked' && !isWriterUnavailabilityBlocker(task)) {
    return {
      ok: false,
      reason: 'BLOCKER_NOT_WRITER_UNAVAILABILITY',
      blockingReason: task.blockingReason
    };
  }
  return { ok: true };
}

/**
 * Ensure task branch/worktree tracks lane integration tip (not dirty owner HEAD).
 */
export function ensureTaskWorktreeFromIntegration(lane, taskId) {
  const cfg = loadFactoryConfig();
  const laneCfg = cfg.lanes[lane];
  const repo = laneCfg.repoRoot;
  const branch = `factory/${lane}-${String(taskId).toLowerCase()}`;
  const wt = worktreePathFor(lane, taskId);
  const integration = laneCfg.integrationBranch;
  const worktreeRoot = resolveWorktreeRoot();
  const integWt = path.join(worktreeRoot, `${lane}-integration`);
  ensureDir(worktreeRoot);

  const tip = runCmd(`git rev-parse ${integration}`, { cwd: integWt });
  const tipSha = (tip.stdout || '').trim();
  if (!tipSha) {
    return { ok: false, reason: 'INTEGRATION_TIP_MISSING', worktreePath: wt, branch };
  }

  runCmd(`git branch -f ${branch} ${tipSha}`, { cwd: repo, timeout: 60000 });

  if (!fs.existsSync(wt)) {
    const add = runCmd(`git worktree add "${wt}" ${branch}`, { cwd: repo, timeout: 180000 });
    if (!add.ok) {
      const add2 = runCmd(`git worktree add "${wt}" ${branch}`, { cwd: integWt, timeout: 180000 });
      if (!add2.ok) {
        return {
          ok: false,
          reason: 'WORKTREE_ADD_FAIL',
          stderr: add2.stderr || add.stderr,
          worktreePath: wt,
          branch
        };
      }
    }
  } else {
    runCmd(`git checkout ${branch}`, { cwd: wt });
    // Fast-forward only — never reset/clean/stash
    runCmd(`git merge --ff-only ${tipSha}`, { cwd: wt });
  }

  return { ok: true, worktreePath: wt, branch, integrationBranch: integration, tipSha };
}

/**
 * Atomic claim for interactive Cursor local executor.
 * writerPid is always null — no fake background process.
 */
export function claimTaskCursorLocal(lane, taskId, { force = false } = {}) {
  const task = getTask(lane, taskId);
  const gate = canClaimWithCursorLocal(task);
  if (!gate.ok && !(force && (gate.reason === 'ALREADY_CLAIMED' || task?.status === 'interrupted'))) {
    return { ok: false, ...gate };
  }

  const active = loadActiveWriters();
  const existing = active.writers?.[lane];
  if (existing && existing.taskId && existing.taskId !== taskId && existing.status === 'running') {
    return { ok: false, reason: 'LANE_ALREADY_CLAIMED', existing };
  }

  const claims = loadClaims();
  const key = claimKey(lane, taskId);
  if (claims.claims[key]?.status === 'running' && !force) {
    return { ok: false, reason: 'DOUBLE_CLAIM', claim: claims.claims[key] };
  }

  const wtInfo = ensureTaskWorktreeFromIntegration(lane, taskId);
  if (!wtInfo.ok) {
    return { ok: false, reason: wtInfo.reason, detail: wtInfo };
  }

  const claimId = crypto.randomUUID();
  const claimedAt = nowIso();
  const evidenceDir = path.join(
    FACTORY_ROOT,
    'logs',
    lane,
    taskId,
    `cursor-local-${claimedAt.replace(/[:.]/g, '-')}`
  );
  ensureDir(evidenceDir);
  const logFile = path.join(evidenceDir, 'writer-cursor-local.log');
  fs.writeFileSync(
    logFile,
    `[claim] ${claimId} lane=${lane} task=${taskId} mode=${CURSOR_LOCAL_MODE} pid=n/a at=${claimedAt}\n`
  );

  const artifactDir = path.join(resolveArtifactRoot(), lane, String(taskId));
  ensureDir(artifactDir);

  const record = {
    lane,
    taskId,
    executor: CURSOR_LOCAL_EXECUTOR,
    writer: CURSOR_LOCAL_EXECUTOR,
    writerPid: null,
    executionMode: CURSOR_LOCAL_MODE,
    claimId,
    claimedAt,
    taskWorktree: wtInfo.worktreePath,
    taskBranch: wtInfo.branch,
    logFile,
    evidenceDir,
    artifactDir,
    status: 'running',
    heavy: true
  };

  claims.claims[key] = record;
  saveClaims(claims);

  active.writers = active.writers || {};
  active.writers[lane] = {
    lane,
    taskId,
    agentId: CURSOR_LOCAL_EXECUTOR,
    runner: CURSOR_LOCAL_MODE,
    pid: null,
    writerPid: null,
    executionMode: CURSOR_LOCAL_MODE,
    claimId,
    logFile,
    worktreePath: wtInfo.worktreePath,
    artifactDir,
    evidenceDir,
    heavy: true,
    status: 'running',
    startedAt: claimedAt
  };
  saveActiveWriters(active);

  const updated = updateTask(lane, taskId, {
    status: 'running',
    executor: CURSOR_LOCAL_EXECUTOR,
    writerRole: CURSOR_LOCAL_EXECUTOR,
    writerPid: null,
    executionMode: CURSOR_LOCAL_MODE,
    claimId,
    claimedAt,
    worktreePath: wtInfo.worktreePath,
    taskBranch: wtInfo.branch,
    blockingReason: null,
    allowIntegratorDispatch: true,
    nextRetryAt: null,
    result: {
      ...(task.result || {}),
      executor: CURSOR_LOCAL_EXECUTOR,
      writer: CURSOR_LOCAL_EXECUTOR,
      writerPid: null,
      executionMode: CURSOR_LOCAL_MODE,
      claimId,
      claimedAt,
      taskWorktree: wtInfo.worktreePath,
      taskBranch: wtInfo.branch,
      logFile,
      evidenceDir,
      artifactDir,
      phase: 'claimed'
    }
  });

  writeMasterStatus();
  return { ok: true, task: updated, claim: record };
}

export function markClaimPhase(lane, taskId, phase, extra = {}) {
  const task = getTask(lane, taskId);
  if (!task || task.claimId == null) {
    return { ok: false, reason: 'NO_ACTIVE_CLAIM' };
  }
  const status =
    phase === 'testing' ? 'testing'
      : phase === 'reviewing' ? 'reviewing'
        : phase === 'passed' ? 'passed'
          : phase === 'integrated' ? 'integrated'
            : task.status;
  return {
    ok: true,
    task: updateTask(lane, taskId, {
      status,
      result: {
        ...(task.result || {}),
        phase,
        ...extra,
        writerPid: null,
        at: nowIso()
      }
    })
  };
}

export function completeClaimIntegrated(lane, taskId, { commit, testsPass = true, reviews = null } = {}) {
  const task = getTask(lane, taskId);
  if (!task) return { ok: false, reason: 'NO_TASK' };
  const key = claimKey(lane, taskId);
  const claims = loadClaims();
  if (claims.claims[key]) {
    claims.claims[key].status = 'integrated';
    claims.claims[key].finishedAt = nowIso();
    claims.claims[key].commit = commit || null;
    saveClaims(claims);
  }
  const active = loadActiveWriters();
  if (active.writers?.[lane]?.taskId === taskId) {
    delete active.writers[lane];
    saveActiveWriters(active);
  }
  const updated = updateTask(lane, taskId, {
    status: 'integrated',
    writerPid: null,
    blockingReason: null,
    result: {
      ...(task.result || {}),
      status: 'PASS',
      phase: 'integrated',
      commit: commit || null,
      testsPass,
      reviews,
      writer: CURSOR_LOCAL_EXECUTOR,
      writerPid: null,
      executionMode: CURSOR_LOCAL_MODE,
      integratedInto: `factory/${lane}-integration`,
      at: nowIso()
    }
  });
  writeMasterStatus();
  return { ok: true, task: updated };
}

export function failClaim(lane, taskId, reason, evidence = {}) {
  const task = getTask(lane, taskId);
  if (!task) return { ok: false, reason: 'NO_TASK' };
  const key = claimKey(lane, taskId);
  const claims = loadClaims();
  if (claims.claims[key]) {
    claims.claims[key].status = 'blocked';
    claims.claims[key].finishedAt = nowIso();
    claims.claims[key].failureReason = reason;
    saveClaims(claims);
  }
  const active = loadActiveWriters();
  if (active.writers?.[lane]?.taskId === taskId) {
    delete active.writers[lane];
    saveActiveWriters(active);
  }
  const updated = updateTask(lane, taskId, {
    status: 'blocked',
    blockingReason: reason,
    writerPid: null,
    result: {
      ...(task.result || {}),
      status: 'FAIL',
      phase: 'blocked',
      blockingReason: reason,
      nextAutomaticRetry: null,
      evidence,
      writerPid: null,
      at: nowIso()
    }
  });
  writeMasterStatus();
  return { ok: true, task: updated };
}

export function interruptClaim(lane, taskId) {
  const task = getTask(lane, taskId);
  if (!task) return { ok: false, reason: 'NO_TASK' };
  const key = claimKey(lane, taskId);
  const claims = loadClaims();
  if (claims.claims[key]) {
    claims.claims[key].status = 'interrupted';
    claims.claims[key].interruptedAt = nowIso();
    saveClaims(claims);
  }
  const active = loadActiveWriters();
  if (active.writers?.[lane]?.taskId === taskId) {
    delete active.writers[lane];
    saveActiveWriters(active);
  }
  const updated = updateTask(lane, taskId, {
    status: 'interrupted',
    writerPid: null,
    result: {
      ...(task.result || {}),
      phase: 'interrupted',
      reason: 'CURSOR_SESSION_INTERRUPTED',
      worktreePreserved: true,
      writerPid: null,
      at: nowIso()
    }
  });
  writeMasterStatus();
  return { ok: true, task: updated };
}

export function recoverInterruptedClaim(lane, taskId) {
  const task = getTask(lane, taskId);
  if (!task || task.status !== 'interrupted') {
    return { ok: false, reason: 'NOT_INTERRUPTED' };
  }
  return claimTaskCursorLocal(lane, taskId, { force: true });
}
