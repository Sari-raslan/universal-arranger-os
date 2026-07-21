import path from 'node:path';
import {
  FACTORY_ROOT,
  ensureDir,
  atomicWriteJson,
  nowIso,
  isPidAlive,
  readJson,
  loadFactoryConfig
} from './lib.mjs';
import { updateTask, ensureEvidenceDir } from './queue-manager.mjs';
import { createTaskWorktree } from './worktree-manager.mjs';
import { preferredWriterForLane, spawnWriterProcess, isWriterAvailable } from './writer-adapters.mjs';
import { writeMasterStatus } from './reporter.mjs';

const ACTIVE_PATH = path.join(FACTORY_ROOT, 'state', 'active-writers.json');

export function loadActiveWriters() {
  return readJson(ACTIVE_PATH, { updatedAt: null, writers: {} });
}

export function saveActiveWriters(data) {
  data.updatedAt = nowIso();
  for (const w of Object.values(data.writers || {})) {
    if (w?.pid && !isPidAlive(w.pid) && w.status === 'running') {
      w.status = 'exited_unconfirmed';
      w.exitedAt = nowIso();
    }
  }
  atomicWriteJson(ACTIVE_PATH, data);
  return data;
}

export function countHeavyWriters() {
  const data = loadActiveWriters();
  let n = 0;
  for (const w of Object.values(data.writers || {})) {
    if (w?.pid && isPidAlive(w.pid) && w.heavy) n += 1;
  }
  return n;
}

export function activeWriterMap() {
  const data = loadActiveWriters();
  const map = {};
  for (const [lane, w] of Object.entries(data.writers || {})) {
    if (w?.pid && isPidAlive(w.pid) && w.taskId) map[lane] = w.taskId;
  }
  return map;
}

function artifactDirFor(lane, taskId) {
  if (lane === 'library') return `D:\\UAOS_AGENT_FACTORY_ARTIFACTS\\library\\${taskId}`;
  return `D:\\UAOS_AGENT_FACTORY_ARTIFACTS\\${lane}\\${taskId}`;
}

/**
 * Generic dispatch — always uses generic-runner.mjs (no per-task-id handler switch).
 */
export function dispatchTaskWriter(lane, task, { maxHeavy = 2 } = {}) {
  const active = loadActiveWriters();
  if (active.writers?.[lane]?.pid && isPidAlive(active.writers[lane].pid)) {
    return { ok: false, reason: 'lane_already_has_writer', writer: active.writers[lane] };
  }
  if (countHeavyWriters() >= maxHeavy) {
    return { ok: false, reason: 'max_heavy_writers', count: countHeavyWriters(), maxHeavy };
  }

  if (task.humanGate) {
    return { ok: false, reason: 'HUMAN_GATE' };
  }

  const evidenceDir = ensureEvidenceDir({
    lane,
    id: task.id,
    evidenceDir: path.join(FACTORY_ROOT, 'logs', lane, task.id, nowIso().replace(/[:.]/g, '-'))
  });
  const wt = createTaskWorktree(lane, task.id);
  const agentId = preferredWriterForLane(lane);
  const runner = path.join(FACTORY_ROOT, 'src', 'generic-runner.mjs');
  const logFile = path.join(evidenceDir, `writer-${agentId}.log`);
  const artifactDir = artifactDirFor(lane, task.id);
  ensureDir(artifactDir);
  ensureDir('D:\\UAOS_AGENT_FACTORY_BUILD\\tmp');

  const cwd = wt.worktreePath || loadFactoryConfig().lanes[lane].repoRoot;
  const forceAgent = isWriterAvailable('codex') ? 'codex' : agentId === 'cursor-local' ? 'synthetic-local' : agentId;

  // For real product tasks without headless writer, still dispatch generic runner
  // which will honestly FAIL with BACKGROUND_CODE_WRITING_BLOCKED unless Codex available
  // or task has localSyntheticAction.
  const localArgs = [
    '--lane',
    lane,
    '--task',
    task.id,
    '--worktree',
    cwd,
    '--artifact',
    artifactDir,
    '--evidence',
    evidenceDir,
    '--force-agent',
    isWriterAvailable('codex') ? 'codex' : task.localSyntheticAction ? 'synthetic-local' : 'cursor-local'
  ];

  const spawned = spawnWriterProcess({
    agentId: 'cursor-local',
    cwd: FACTORY_ROOT,
    prompt: '',
    logFile,
    localRunner: runner,
    localArgs
  });

  const record = {
    lane,
    taskId: task.id,
    agentId: isWriterAvailable('codex') ? 'codex' : 'cursor-local',
    runner: 'generic-runner',
    runnerPath: runner,
    pid: spawned.pid,
    logFile,
    worktreePath: cwd,
    artifactDir,
    evidenceDir,
    heavy: true,
    status: 'running',
    startedAt: nowIso()
  };

  active.writers = active.writers || {};
  active.writers[lane] = record;
  saveActiveWriters(active);

  updateTask(lane, task.id, {
    status: 'running',
    worktreePath: cwd,
    writerRole: record.agentId,
    result: {
      dispatchedAt: nowIso(),
      writerPid: spawned.pid,
      writerAgent: record.agentId,
      runner: 'generic-runner',
      logFile,
      evidenceDir,
      artifactDir
    }
  });
  writeMasterStatus();
  return { ok: true, record };
}

export function reconcileWriterExits() {
  const active = loadActiveWriters();
  const changes = [];
  for (const [lane, w] of Object.entries(active.writers || {})) {
    if (!w?.pid || !w.taskId) continue;
    if (isPidAlive(w.pid)) continue;
    if (w.status !== 'running' && w.status !== 'exited_unconfirmed') continue;

    const resultPath = path.join(w.artifactDir || '', `${w.taskId}-result.json`);
    const alt = path.join(w.evidenceDir || '', `${w.taskId}-result.json`);
    const result = readJson(resultPath, null) || readJson(alt, null);

    if (result?.status === 'PASS' || result?.ok === true) {
      // generic-runner already updates queue on success; just clear active record
      w.status = 'passed';
      changes.push({ lane, taskId: w.taskId, status: 'passed' });
    } else if (result?.status === 'FAIL' || result?.ok === false) {
      w.status = 'failed';
      changes.push({ lane, taskId: w.taskId, status: 'failed' });
    } else {
      updateTask(lane, w.taskId, {
        status: 'retry',
        result: {
          reason: 'WRITER_EXITED_WITHOUT_RESULT',
          writerPid: w.pid,
          logFile: w.logFile,
          finishedAt: nowIso()
        }
      });
      w.status = 'failed';
      changes.push({ lane, taskId: w.taskId, status: 'retry_no_result' });
    }
    w.finishedAt = nowIso();
  }
  saveActiveWriters(active);
  if (changes.length) writeMasterStatus();
  return changes;
}
