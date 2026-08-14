import fs from 'node:fs';
import path from 'node:path';
import {
  FACTORY_ROOT,
  atomicWriteJson,
  readJson,
  nowIso,
  isPidAlive,
  ensureDir
} from './lib.mjs';
import { interruptRunningTasks } from './queue-manager.mjs';
import { pickNextLaneWork } from './scheduler.mjs';
import { recoverSingyS001, recoverArrangerA001, recoverLibraryL001 } from './recovery.mjs';
import { writeMasterStatus } from './reporter.mjs';
import { evaluateResources } from './resource-guard.mjs';
import {
  dispatchTaskWriter,
  reconcileWriterExits,
  activeWriterMap,
  loadActiveWriters,
  terminateOwnedWriters,
  countOwnedAliveWriters
} from './dispatch.mjs';
import { reconcileStaleClaims } from './cursor-local-claim.mjs';

const STATE_PATH = path.join(FACTORY_ROOT, 'state', 'factory-state.json');
const PID_PATH = path.join(FACTORY_ROOT, 'state', 'supervisor.pid.json');
const LOCK_PATH = path.join(FACTORY_ROOT, 'state', 'supervisor.lock');
const PAUSE_PATH = path.join(FACTORY_ROOT, 'state', 'PAUSE');

const RECOVERY_HANDLERS = {
  'singy:S-001': recoverSingyS001,
  'arranger:A-001': recoverArrangerA001,
  'library:L-001': recoverLibraryL001
};

function acquireLock() {
  ensureDir(path.dirname(LOCK_PATH));
  if (fs.existsSync(LOCK_PATH)) {
    const existing = readJson(LOCK_PATH, null);
    if (existing?.pid && isPidAlive(existing.pid) && existing.pid !== process.pid) {
      throw new Error(`Supervisor already running pid=${existing.pid}`);
    }
    fs.renameSync(LOCK_PATH, `${LOCK_PATH}.stale.${Date.now()}`);
  }
  atomicWriteJson(LOCK_PATH, { pid: process.pid, acquiredAt: nowIso() });
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
  } catch {
    /* ignore */
  }
}

function setState(patch) {
  const prev = readJson(STATE_PATH, {});
  const next = { ...prev, ...patch, updatedAt: nowIso() };
  atomicWriteJson(STATE_PATH, next);
  return next;
}

function resumeInterrupted() {
  let n = 0;
  for (const lane of ['singy', 'arranger', 'library']) {
    n += interruptRunningTasks(lane);
  }
  return n;
}

async function executeTask(lane, task, maxHeavy) {
  const key = `${lane}:${task.id}`;
  const recovery = RECOVERY_HANDLERS[key];
  if (recovery) {
    try {
      const result = await recovery();
      return { ok: true, result, mode: 'recovery' };
    } catch (err) {
      return { ok: false, error: String(err.message || err), mode: 'recovery' };
    }
  }

  const dispatched = dispatchTaskWriter(lane, task, { maxHeavy });
  return { ...dispatched, mode: 'writer_dispatch' };
}

export async function runSupervisorLoop({ once = false } = {}) {
  acquireLock();
  atomicWriteJson(PID_PATH, { pid: process.pid, startedAt: nowIso() });
  const interrupted = resumeInterrupted();
  setState({
    status: 'running',
    supervisorPid: process.pid,
    interruptedOnResume: interrupted,
    startedAt: nowIso(),
    dispatchVersion: 'writer-dispatch-v2'
  });

  let lastStatus = 0;

  const tick = async () => {
    if (fs.existsSync(PAUSE_PATH)) {
      setState({ status: 'paused', supervisorPid: process.pid });
      writeMasterStatus();
      return;
    }

    reconcileWriterExits();
    reconcileStaleClaims();

    const resources = evaluateResources();
    if (resources.pauseFactory) {
      setState({ status: 'paused_critical_disk', resources });
      writeMasterStatus();
      return;
    }

    const live = activeWriterMap();
    const pick = pickNextLaneWork(live);
    if (pick.action === 'run') {
      setState({
        status: 'running',
        current: { lane: pick.lane, taskId: pick.task.id },
        resources: pick.resources,
        activeWriters: loadActiveWriters()
      });
      await executeTask(pick.lane, pick.task, pick.maxWriters || 2);
    } else {
      setState({
        status: pick.action === 'idle' ? 'idle' : 'running',
        current: null,
        scheduler: pick.action,
        resources: pick.resources,
        activeWriters: loadActiveWriters()
      });
    }

    if (Date.now() - lastStatus > 30_000) {
      writeMasterStatus();
      lastStatus = Date.now();
    }
  };

  try {
    if (once) {
      await tick();
      // second tick to fill second writer slot
      await tick();
      writeMasterStatus();
      return;
    }

    while (true) {
      if (fs.existsSync(path.join(FACTORY_ROOT, 'state', 'STOP'))) {
        setState({ status: 'stopping', supervisorPid: process.pid, stoppingAt: nowIso() });
        const killed = terminateOwnedWriters();
        // brief wait for log flush / child exit
        const end = Date.now() + 1500;
        while (Date.now() < end) {
          /* wait */
        }
        const orphans = countOwnedAliveWriters();
        setState({
          status: 'stopped',
          stoppedAt: nowIso(),
          safeStop: { killedWriters: killed, orphanOwnedWriters: orphans }
        });
        writeMasterStatus();
        break;
      }
      await tick();
      await new Promise((r) => setTimeout(r, 4000));
    }
  } finally {
    releaseLock();
  }
}
