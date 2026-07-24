import crypto from 'node:crypto';
import { nowIso } from './lib.mjs';

/** Attempt 1 immediate; after fail1 wait 30s; after fail2 wait 120s; after fail3 block. */
export const RETRY_BACKOFF_MS = [0, 30_000, 120_000];
export const MAX_AUTO_ATTEMPTS = 3;

export const AWAITING_RUNNER_REASONS = new Set([
  'AWAITING_TASK_RUNNER',
  'AWAITING_WRITER_HANDLER'
]);

export const WRITER_BLOCKED_REASONS = new Set([
  'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI'
]);

export function runnerCommandHash(command, args = []) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ command, args }))
    .digest('hex')
    .slice(0, 16);
}

export function backoffAfterFailureMs(retryCountAfterFailure) {
  if (retryCountAfterFailure === 1) return RETRY_BACKOFF_MS[1];
  if (retryCountAfterFailure === 2) return RETRY_BACKOFF_MS[2];
  return null;
}

export function isTerminalSuccessStatus(status) {
  return ['passed', 'integrated'].includes(status);
}

export function isAwaitingRunner(task) {
  const reason = task?.blockingReason || task?.result?.reason;
  return AWAITING_RUNNER_REASONS.has(reason);
}

export function isWriterAuthBlocked(task) {
  const reason = task?.blockingReason || task?.result?.reason;
  return WRITER_BLOCKED_REASONS.has(reason);
}

/**
 * Whether scheduler/dispatch may attempt this task now.
 */
export function canAttemptTask(task, { now = Date.now(), forceResume = false } = {}) {
  if (!task) return { ok: false, reason: 'NO_TASK' };
  if (isTerminalSuccessStatus(task.status)) {
    return { ok: false, reason: 'ALREADY_COMPLETE', status: task.status };
  }
  if (task.status === 'blocked' && !forceResume) {
    return { ok: false, reason: 'CIRCUIT_OPEN', blockingReason: task.blockingReason || task.result?.blockingReason };
  }
  if (isAwaitingRunner(task) && !forceResume) {
    return { ok: false, reason: 'AWAITING_TASK_RUNNER_NO_SPAWN' };
  }
  if (isWriterAuthBlocked(task) && !task.allowIntegratorDispatch && !forceResume) {
    return { ok: false, reason: 'BACKGROUND_CODE_WRITING_BLOCKED_NO_SPAWN' };
  }
  if (!['pending', 'ready', 'retry'].includes(task.status) && task.status !== 'blocked') {
    return { ok: false, reason: 'STATUS_NOT_RUNNABLE', status: task.status };
  }
  if (!forceResume && task.nextRetryAt) {
    const due = Date.parse(task.nextRetryAt);
    if (Number.isFinite(due) && due > now) {
      return { ok: false, reason: 'BACKOFF_WAIT', nextRetryAt: task.nextRetryAt };
    }
  }
  const attempts = task.retryCount || 0;
  if (!forceResume && attempts >= MAX_AUTO_ATTEMPTS) {
    return { ok: false, reason: 'MAX_ATTEMPTS', retryCount: attempts };
  }
  return { ok: true };
}

export function buildFailurePatch(task, { exitCode = null, error = '', commandHash = null } = {}) {
  const retryCount = (task.retryCount || 0) + 1;
  const at = nowIso();
  const base = {
    retryCount,
    lastAttemptAt: at,
    lastExitCode: exitCode,
    lastError: error || null,
    runnerCommandHash: commandHash || task.runnerCommandHash || null
  };

  if (retryCount >= MAX_AUTO_ATTEMPTS) {
    return {
      ...base,
      status: 'blocked',
      nextRetryAt: null,
      blockingReason: error || 'MAX_AUTO_ATTEMPTS',
      result: {
        ...(task.result || {}),
        blockingReason: error || 'MAX_AUTO_ATTEMPTS',
        nextAutomaticRetry: null,
        retryCount,
        lastExitCode: exitCode,
        lastError: error || null,
        at
      }
    };
  }

  const waitMs = backoffAfterFailureMs(retryCount);
  const nextRetryAt = new Date(Date.now() + waitMs).toISOString();
  return {
    ...base,
    status: 'retry',
    nextRetryAt,
    blockingReason: null,
    result: {
      ...(task.result || {}),
      retryCount,
      nextRetryAt,
      lastExitCode: exitCode,
      lastError: error || null,
      at
    }
  };
}

export function buildBlockedOncePatch(task, reason, note = '') {
  const at = nowIso();
  return {
    status: 'blocked',
    retryCount: task.retryCount || 0,
    lastAttemptAt: at,
    nextRetryAt: null,
    lastExitCode: null,
    lastError: reason,
    blockingReason: reason,
    result: {
      ...(task.result || {}),
      reason,
      note,
      blockingReason: reason,
      nextAutomaticRetry: null,
      at
    }
  };
}

export function buildResumePatch(task) {
  return {
    status: 'ready',
    nextRetryAt: null,
    blockingReason: null,
    allowIntegratorDispatch: true,
    result: {
      ...(task.result || {}),
      resumedAt: nowIso(),
      nextAutomaticRetry: null,
      reason: 'OWNER_RESUME'
    }
  };
}
