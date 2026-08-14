import path from 'node:path';
import fs from 'node:fs';
import {
  FACTORY_ROOT,
  atomicWriteJson,
  readJson,
  ensureDir,
  nowIso,
  containsForbiddenCommand,
  isSyntheticTaskId
} from './lib.mjs';
import { canAttemptTask, isTerminalSuccessStatus } from './retry-policy.mjs';

const QUEUE_DIR = path.join(FACTORY_ROOT, 'queues');
const TRANSITION_LOG = path.join(FACTORY_ROOT, 'logs', 'task-transitions.log');

/** Allowed status transitions (from → to[]). Same-status patches are always allowed (idempotent). */
const ALLOWED_TRANSITIONS = {
  pending: ['ready', 'blocked', 'running', 'waiting_human'],
  ready: ['running', 'blocked', 'pending', 'waiting_human', 'retry', 'passed'],
  retry: ['running', 'blocked', 'ready', 'waiting_human', 'passed'],
  running: ['testing', 'reviewing', 'blocked', 'retry', 'passed', 'integrated', 'waiting_human'],
  scouting: ['running', 'testing', 'blocked', 'retry'],
  testing: ['reviewing', 'blocked', 'retry', 'passed', 'integrated', 'running'],
  reviewing: ['passed', 'blocked', 'retry', 'integrated', 'testing'],
  passed: ['integrated', 'blocked', 'ready'],
  integrated: ['integrated'],
  blocked: ['ready', 'retry', 'pending', 'blocked', 'passed', 'waiting_human'],
  waiting_human: ['passed', 'blocked', 'ready', 'retry']
};

export function queuePath(lane) {
  return path.join(QUEUE_DIR, `${lane}.queue.json`);
}

export function loadQueue(lane) {
  return readJson(queuePath(lane), { lane, updatedAt: null, tasks: [] });
}

export function saveQueue(lane, queue) {
  queue.updatedAt = nowIso();
  atomicWriteJson(queuePath(lane), queue);
  return queue;
}

export function getTask(lane, taskId) {
  const q = loadQueue(lane);
  return q.tasks.find((t) => t.id === taskId) || null;
}

/**
 * Proven integration: status integrated AND integrationStatus INTEGRATED
 * (legacy integrated rows without the field still count until reconciliation stamps them).
 */
export function isDurablyIntegrated(task) {
  if (!task) return false;
  if (task.status !== 'integrated') return false;
  if (task.integrationStatus === 'NOT_INTEGRATED') return false;
  if (task.integrationStatus === 'INTEGRATED') return true;
  // Legacy: status integrated with no explicit NOT_INTEGRATED — accept until audit stamps field
  if (!task.integrationStatus) return true;
  return false;
}

function appendTransitionLog(entry) {
  try {
    ensureDir(path.dirname(TRANSITION_LOG));
    fs.appendFileSync(TRANSITION_LOG, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch {
    /* never fail mutation on log I/O */
  }
}

export function updateTask(lane, taskId, patch) {
  const q = loadQueue(lane);
  const idx = q.tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) {
    const err = new Error(`Task not found: ${lane}/${taskId}`);
    err.code = 'TASK_NOT_FOUND';
    throw err;
  }
  q.tasks[idx] = {
    ...q.tasks[idx],
    ...patch,
    updatedAt: nowIso()
  };
  saveQueue(lane, q);
  return q.tasks[idx];
}

/**
 * Canonical durable transition used by runners and PASS reconciliation.
 * Validates previous status, writes queue atomically, emits transition log.
 * Returns { ok, task } or { ok:false, reason }.
 */
export function transitionTask(lane, taskId, patch = {}) {
  const q = loadQueue(lane);
  const idx = q.tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) {
    return { ok: false, reason: 'TASK_NOT_FOUND', code: 'TASK_NOT_FOUND' };
  }
  const prev = q.tasks[idx];
  const nextStatus = patch.status ?? prev.status;
  if (nextStatus !== prev.status) {
    const allowed = ALLOWED_TRANSITIONS[prev.status] || [];
    if (!allowed.includes(nextStatus)) {
      return {
        ok: false,
        reason: 'INVALID_TRANSITION',
        from: prev.status,
        to: nextStatus
      };
    }
  }

  const merged = {
    ...prev,
    ...patch,
    result: patch.result
      ? { ...(prev.result || {}), ...patch.result }
      : prev.result,
    updatedAt: nowIso()
  };

  q.tasks[idx] = merged;
  try {
    saveQueue(lane, q);
  } catch (err) {
    return {
      ok: false,
      reason: 'STATE_PERSISTENCE_FAILED',
      code: 'STATE_PERSISTENCE_FAILED',
      error: String(err?.message || err)
    };
  }

  appendTransitionLog({
    at: nowIso(),
    lane,
    taskId,
    from: prev.status,
    to: merged.status,
    blockingReason: merged.blockingReason || null,
    integrationStatus: merged.integrationStatus || null
  });

  return { ok: true, task: merged, previousStatus: prev.status };
}

export function dependenciesSatisfied(task, queue) {
  const deps = task.dependsOn || [];
  return deps.every((depId) => {
    const dep = queue.tasks.find((t) => t.id === depId);
    return isDurablyIntegrated(dep);
  });
}

export function nextRunnableTask(lane) {
  const q = loadQueue(lane);
  const candidates = q.tasks
    .filter((t) => !isSyntheticTaskId(t.id))
    .filter((t) => ['pending', 'ready', 'retry'].includes(t.status))
    .filter((t) => !isTerminalSuccessStatus(t.status))
    .filter((t) => dependenciesSatisfied(t, q))
    .filter((t) => canAttemptTask(t).ok)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return candidates[0] || null;
}

export function interruptRunningTasks(lane) {
  const q = loadQueue(lane);
  let changed = 0;
  for (const t of q.tasks) {
    if (['running', 'scouting', 'testing', 'reviewing'].includes(t.status)) {
      t.status = 'retry';
      t.result = {
        ...(t.result || {}),
        interruptedAt: nowIso(),
        reason: 'supervisor_resume_interrupted_running'
      };
      changed += 1;
    }
  }
  if (changed) saveQueue(lane, q);
  return changed;
}

export function assertTaskCommandsSafe(task) {
  const blobs = [];
  for (const group of Object.values(task.commands || {})) {
    for (const cmd of group || []) blobs.push(cmd);
  }
  const hits = containsForbiddenCommand(blobs.join('\n'));
  if (hits.length) {
    throw new Error(`Forbidden commands in task ${task.id}: ${hits.join(', ')}`);
  }
}

export function ensureEvidenceDir(task) {
  const dir = task.evidenceDir || path.join(FACTORY_ROOT, 'logs', task.lane, task.id);
  ensureDir(dir);
  return dir;
}

/** Strict task-id format used by factory queues (e.g. S-010, L-SYN-GENERIC, A-100R1). */
export function isValidTaskIdFormat(taskId) {
  return /^[SAL]-[A-Z0-9]+(?:-[A-Z0-9]+)*$/i.test(String(taskId || ''));
}
