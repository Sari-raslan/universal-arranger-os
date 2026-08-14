import path from 'node:path';
import {
  FACTORY_ROOT,
  ensureDir,
  atomicWriteJson,
  nowIso,
  isPidAlive,
  readJson,
  loadFactoryConfig,
  CURSOR_LOCAL_HEARTBEAT_STALE_MS
} from './lib.mjs';
import { updateTask, ensureEvidenceDir, getTask, transitionTask } from './queue-manager.mjs';
import { createTaskWorktree } from './worktree-manager.mjs';
import { preferredWriterForLane, spawnWriterProcess, isWriterAvailable } from './writer-adapters.mjs';
import { writeMasterStatus } from './reporter.mjs';
import {
  canAttemptTask,
  buildFailurePatch,
  buildBlockedOncePatch,
  runnerCommandHash,
  isAwaitingRunner
} from './retry-policy.mjs';

const ACTIVE_PATH = path.join(FACTORY_ROOT, 'state', 'active-writers.json');

export function loadActiveWriters() {
  return readJson(ACTIVE_PATH, { updatedAt: null, writers: {} });
}

function isHeartbeatFresh(w) {
  if (!w?.heartbeatAt) return false;
  const age = Date.now() - new Date(w.heartbeatAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < CURSOR_LOCAL_HEARTBEAT_STALE_MS;
}

/**
 * Is this active-writers.json entry a currently active writer?
 * Process-backed writers (pid set) are active while the pid is alive.
 * No-pid interactive writers (cursor-local) are active only while their
 * heartbeat is fresh — otherwise they'd be permanently invisible to the
 * lane-busy and stale-recovery checks below.
 */
export function isWriterEntryActive(w) {
  if (!w) return false;
  if (w.pid) return isPidAlive(w.pid);
  return w.status === 'running' && isHeartbeatFresh(w);
}

export function saveActiveWriters(data) {
  data.updatedAt = nowIso();
  for (const w of Object.values(data.writers || {})) {
    if (w?.pid && !isPidAlive(w.pid) && w.status === 'running') {
      w.status = 'exited_unconfirmed';
      w.exitedAt = nowIso();
    } else if (!w?.pid && w?.status === 'running' && !isHeartbeatFresh(w)) {
      w.status = 'stale_unconfirmed';
      w.staleAt = nowIso();
    }
  }
  atomicWriteJson(ACTIVE_PATH, data);
  return data;
}

export function countHeavyWriters() {
  const data = loadActiveWriters();
  let n = 0;
  for (const w of Object.values(data.writers || {})) {
    if (w?.heavy && isWriterEntryActive(w)) n += 1;
  }
  return n;
}

export function activeWriterMap() {
  const data = loadActiveWriters();
  const map = {};
  for (const [lane, w] of Object.entries(data.writers || {})) {
    if (w?.taskId && isWriterEntryActive(w)) map[lane] = w.taskId;
  }
  return map;
}

function artifactDirFor(lane, taskId) {
  const cfg = loadFactoryConfig();
  const artifactRoot = cfg?.artifactRoot || path.join(FACTORY_ROOT, 'state', 'artifacts');
  const base = path.join(artifactRoot, lane === 'library' ? 'library' : lane, taskId);
  ensureDir(base);
  return base;
}

/**
 * Generic dispatch — always uses generic-runner.mjs (no per-task-id handler switch).
 */
export function dispatchTaskWriter(lane, task, { maxHeavy = 2, forceResume = false } = {}) {
  const active = loadActiveWriters();
  if (isWriterEntryActive(active.writers?.[lane])) {
    return { ok: false, reason: 'lane_already_has_writer', writer: active.writers[lane] };
  }
  if (countHeavyWriters() >= maxHeavy) {
    return { ok: false, reason: 'max_heavy_writers', count: countHeavyWriters(), maxHeavy };
  }

  if (task.humanGate) {
    return { ok: false, reason: 'HUMAN_GATE' };
  }

  // Never mutate completed milestones — even if a caller passes a stale in-memory task.
  const live = getTask(lane, task.id);
  if (live && ['passed', 'integrated'].includes(live.status)) {
    return { ok: false, reason: 'ALREADY_COMPLETE', status: live.status, spawned: false };
  }
  const effective = live ? { ...live, ...task, status: live.status } : task;

  const attempt = canAttemptTask(effective, { forceResume });
  if (!attempt.ok) {
    if (attempt.reason === 'AWAITING_TASK_RUNNER_NO_SPAWN') {
      // Persist once; never spawn for missing runner.
      if (effective.status !== 'blocked' || effective.blockingReason !== 'AWAITING_TASK_RUNNER') {
        updateTask(lane, effective.id, buildBlockedOncePatch(effective, 'AWAITING_TASK_RUNNER', 'Missing runner — no child spawn'));
      }
      return { ok: false, reason: 'AWAITING_TASK_RUNNER', spawned: false };
    }
    return { ok: false, reason: attempt.reason, spawned: false, detail: attempt };
  }

  // Durable background product writing requires a verified headless writer (Codex),
  // unless owner resumed with allowIntegratorDispatch / localSyntheticAction.
  if (!isWriterAvailable('codex') && !effective.localSyntheticAction && !effective.allowIntegratorDispatch) {
    updateTask(lane, effective.id, buildBlockedOncePatch(
      effective,
      'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI',
      'Generic runner is ready; Codex CLI/auth/model blocked. No automatic relaunch. Resume after CLI fix or owner Resume.'
    ));
    return { ok: false, reason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI', spawned: false };
  }

  // Owner Resume for Cursor integrator: track eligibility but do not spawn a failing headless child.
  if (!isWriterAvailable('codex') && effective.allowIntegratorDispatch && !effective.localSyntheticAction) {
    return { ok: false, reason: 'AWAITING_CURSOR_INTEGRATOR', spawned: false };
  }

  const evidenceDir = ensureEvidenceDir({
    lane,
    id: effective.id,
    evidenceDir: path.join(FACTORY_ROOT, 'logs', lane, effective.id, nowIso().replace(/[:.]/g, '-'))
  });
  const wt = createTaskWorktree(lane, effective.id);
  const agentId = preferredWriterForLane(lane);
  const runner = path.join(FACTORY_ROOT, 'src', 'generic-runner.mjs');
  const logFile = path.join(evidenceDir, `writer-${agentId}.log`);
  const artifactDir = artifactDirFor(lane, effective.id);
  ensureDir(path.dirname(artifactDir));
  ensureDir(path.join(FACTORY_ROOT, 'state', 'tmp'));

  const cwd = wt.worktreePath || loadFactoryConfig().lanes[lane].repoRoot;

  const localArgs = [
    '--lane',
    lane,
    '--task',
    effective.id,
    '--worktree',
    cwd,
    '--artifact',
    artifactDir,
    '--evidence',
    evidenceDir,
    '--force-agent',
    isWriterAvailable('codex') ? 'codex' : effective.localSyntheticAction ? 'synthetic-local' : 'cursor-local'
  ];

  const cmdHash = runnerCommandHash(process.execPath, [runner, ...localArgs]);
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
    taskId: effective.id,
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
    startedAt: nowIso(),
    runnerCommandHash: cmdHash,
    timeoutMinutes: effective.timeoutMinutes || 90
  };

  active.writers = active.writers || {};
  active.writers[lane] = record;
  saveActiveWriters(active);

  updateTask(lane, effective.id, {
    status: 'running',
    worktreePath: cwd,
    writerRole: record.agentId,
    lastAttemptAt: nowIso(),
    runnerCommandHash: cmdHash,
    result: {
      dispatchedAt: nowIso(),
      writerPid: spawned.pid,
      writerAgent: record.agentId,
      runner: 'generic-runner',
      logFile,
      evidenceDir,
      artifactDir,
      runnerCommandHash: cmdHash
    }
  });
  writeMasterStatus();
  return { ok: true, record, spawned: true };
}

/**
 * Durable reconciliation when a writer child exits with a PASS result file.
 * Never leave the queue stuck in running/testing/reviewing from memory-only updates.
 */
export function reconcileWriterPass(lane, taskId, result, writerMeta = {}) {
  const live = getTask(lane, taskId);
  if (!live) {
    return { ok: false, reason: 'TASK_NOT_FOUND' };
  }

  // Idempotent: already durably integrated / passed with matching evidence
  if (live.status === 'integrated' && live.integrationStatus !== 'NOT_INTEGRATED') {
    return { ok: true, status: 'integrated', idempotent: true, task: live };
  }
  if (live.status === 'passed' && result?.integrate?.ok !== true) {
    return { ok: true, status: 'passed', idempotent: true, task: live };
  }

  const at = nowIso();
  const baseResult = {
    ...(live.result || {}),
    writerPid: writerMeta.pid,
    logFile: writerMeta.logFile,
    finishedAt: at,
    reconciledPassAt: at,
    writerResult: result
  };

  // Full pipeline PASS with proven integration
  if (result?.integrate?.ok === true || result?.integrationStatus === 'INTEGRATED') {
    const tr = transitionTask(lane, taskId, {
      status: 'integrated',
      integrationStatus: 'INTEGRATED',
      blockingReason: null,
      nextAutomaticRetry: null,
      result: {
        ...baseResult,
        status: 'PASS',
        integrate: result.integrate,
        commit: result.commit?.head || result.commit || live.result?.commit,
        at
      }
    });
    return tr.ok
      ? { ok: true, status: 'integrated', task: tr.task, idempotent: false }
      : { ok: false, reason: tr.reason || 'STATE_PERSISTENCE_FAILED', code: tr.code };
  }

  // Integrate attempted but failed — durable blocked
  if (result?.integrate && result.integrate.ok === false) {
    const tr = transitionTask(lane, taskId, {
      status: 'blocked',
      integrationStatus: 'NOT_INTEGRATED',
      blockingReason: result.integrate.reason || result.reason || 'INTEGRATE_FAIL',
      nextAutomaticRetry: null,
      result: {
        ...baseResult,
        reason: result.integrate.reason || result.reason,
        integrate: result.integrate,
        at
      }
    });
    return tr.ok
      ? { ok: true, status: 'blocked', task: tr.task }
      : { ok: false, reason: tr.reason || 'STATE_PERSISTENCE_FAILED' };
  }

  // Writer-level PASS but pipeline incomplete (process died mid-flight)
  if (['running', 'scouting', 'testing', 'reviewing'].includes(live.status)) {
    // If final summary says PASS without integrate block, mark passed (not integrated)
    if (result?.status === 'PASS' && (result.tests || result.review)) {
      const tr = transitionTask(lane, taskId, {
        status: 'passed',
        integrationStatus: 'NOT_INTEGRATED',
        result: {
          ...baseResult,
          status: 'PASS',
          note: 'Writer/pipeline PASS reconciled; integration not proven',
          at
        }
      });
      return tr.ok
        ? { ok: true, status: 'passed', task: tr.task }
        : { ok: false, reason: tr.reason || 'STATE_PERSISTENCE_FAILED' };
    }
    // Early writer-only PASS file — durable testing so lane is not stuck in running
    const tr = transitionTask(lane, taskId, {
      status: live.status === 'running' || live.status === 'scouting' ? 'testing' : live.status === 'testing' ? 'reviewing' : 'passed',
      result: {
        ...baseResult,
        status: 'PASS',
        phase: 'reconciled_writer_pass',
        note: 'Durable PASS reconciliation after writer exit',
        at
      }
    });
    return tr.ok
      ? { ok: true, status: tr.task.status, task: tr.task }
      : { ok: false, reason: tr.reason || 'STATE_PERSISTENCE_FAILED' };
  }

  return { ok: true, status: live.status, idempotent: true, task: live };
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
    const liveTask = getTask(lane, w.taskId) || { id: w.taskId, retryCount: 0, result: {} };

    if (result?.status === 'PASS' || result?.ok === true) {
      const rec = reconcileWriterPass(lane, w.taskId, result, w);
      if (!rec.ok && rec.reason === 'STATE_PERSISTENCE_FAILED') {
        transitionTask(lane, w.taskId, {
          status: 'blocked',
          blockingReason: 'STATE_PERSISTENCE_FAILED',
          integrationStatus: 'NOT_INTEGRATED',
          nextAutomaticRetry: null,
          result: {
            ...(liveTask.result || {}),
            reason: 'STATE_PERSISTENCE_FAILED',
            writerResult: result,
            at: nowIso()
          }
        });
        w.status = 'failed';
        changes.push({ lane, taskId: w.taskId, status: 'blocked', reason: 'STATE_PERSISTENCE_FAILED' });
      } else {
        w.status = 'passed';
        changes.push({
          lane,
          taskId: w.taskId,
          status: rec.status || 'passed',
          durable: true,
          idempotent: Boolean(rec.idempotent)
        });
      }
    } else if (result?.status === 'FAIL' || result?.ok === false) {
      // Prefer the most specific truthful reason (e.g. a real integration-planner verdict like
      // INTEGRATION_HEAD_ADVANCED) over the generic top-level fields — mirrors the check
      // reconcileWriterPass already does correctly for its own integrate-failed branch above.
      const patch = buildFailurePatch(liveTask, {
        exitCode: result.exitCode ?? 1,
        error: result.integrate?.reason || result.reason || result.firstBlocker || 'WRITER_FAIL',
        commandHash: w.runnerCommandHash
      });
      updateTask(lane, w.taskId, patch);
      w.status = 'failed';
      changes.push({ lane, taskId: w.taskId, status: patch.status });
    } else {
      const patch = buildFailurePatch(liveTask, {
        exitCode: null,
        error: 'WRITER_EXITED_WITHOUT_RESULT',
        commandHash: w.runnerCommandHash
      });
      updateTask(lane, w.taskId, {
        ...patch,
        result: {
          ...patch.result,
          writerPid: w.pid,
          logFile: w.logFile,
          finishedAt: nowIso()
        }
      });
      w.status = 'failed';
      changes.push({ lane, taskId: w.taskId, status: patch.status });
    }
    w.finishedAt = nowIso();
  }
  saveActiveWriters(active);
  if (changes.length) writeMasterStatus();
  return changes;
}

/** Terminate only factory-owned writer child PIDs recorded in active-writers.json. */
export function terminateOwnedWriters() {
  const active = loadActiveWriters();
  const killed = [];
  for (const [lane, w] of Object.entries(active.writers || {})) {
    if (w?.pid && isPidAlive(w.pid)) {
      try {
        process.kill(w.pid);
        killed.push({ lane, taskId: w.taskId, pid: w.pid });
      } catch {
        /* ignore */
      }
    }
    if (w) w.status = 'stopped';
  }
  active.writers = {};
  saveActiveWriters(active);
  return killed;
}

export function countOwnedAliveWriters() {
  const active = loadActiveWriters();
  let n = 0;
  for (const w of Object.values(active.writers || {})) {
    if (w?.pid && isPidAlive(w.pid)) n += 1;
  }
  return n;
}

export { isAwaitingRunner };
