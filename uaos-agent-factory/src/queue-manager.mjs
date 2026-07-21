import path from 'node:path';
import {
  FACTORY_ROOT,
  atomicWriteJson,
  readJson,
  ensureDir,
  nowIso,
  containsForbiddenCommand
} from './lib.mjs';

const QUEUE_DIR = path.join(FACTORY_ROOT, 'queues');

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

export function updateTask(lane, taskId, patch) {
  const q = loadQueue(lane);
  const idx = q.tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) throw new Error(`Task not found: ${lane}/${taskId}`);
  q.tasks[idx] = {
    ...q.tasks[idx],
    ...patch,
    updatedAt: nowIso()
  };
  saveQueue(lane, q);
  return q.tasks[idx];
}

export function dependenciesSatisfied(task, queue) {
  const deps = task.dependsOn || [];
  return deps.every((depId) => {
    const dep = queue.tasks.find((t) => t.id === depId);
    return dep && ['passed', 'integrated'].includes(dep.status);
  });
}

export function nextRunnableTask(lane) {
  const q = loadQueue(lane);
  const candidates = q.tasks
    .filter((t) => ['pending', 'ready', 'retry'].includes(t.status))
    .filter((t) => dependenciesSatisfied(t, q))
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
