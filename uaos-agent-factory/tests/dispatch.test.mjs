import './test-env.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { FACTORY_ROOT, atomicWriteJson, hiddenSpawnOptions, freeDiskGb } from '../src/lib.mjs';
import { pickNextLaneWork, effectiveMaxHeavyWriters } from '../src/scheduler.mjs';
import { updateTask, loadQueue, getTask } from '../src/queue-manager.mjs';
import { evaluateResources } from '../src/resource-guard.mjs';
import { isWriterEntryActive } from '../src/dispatch.mjs';
import {
  canAttemptTask,
  buildFailurePatch,
  backoffAfterFailureMs,
  RETRY_BACKOFF_MS,
  MAX_AUTO_ATTEMPTS,
  buildBlockedOncePatch,
  isTerminalSuccessStatus
} from '../src/retry-policy.mjs';

test('hidden spawn options force windowsHide and shell false', () => {
  const opts = hiddenSpawnOptions(['ignore', 'ignore', 'ignore']);
  assert.equal(opts.windowsHide, true);
  assert.equal(opts.shell, false);
  assert.equal(opts.detached, true);
});

test('freeDiskGb does not require visible PowerShell (statfs or hidden fallback)', () => {
  const d = freeDiskGb('D', { bypassCache: true });
  assert.equal(typeof d, 'number');
  assert.ok(d > 0);
});

test('no-pid interactive writers require a fresh heartbeat', () => {
  const fresh = { pid: null, status: 'running', heartbeatAt: new Date().toISOString() };
  const stale = { pid: null, status: 'running', heartbeatAt: new Date(Date.now() - 31 * 60 * 1000).toISOString() };
  assert.equal(isWriterEntryActive(fresh), true);
  assert.equal(isWriterEntryActive(stale), false);
  assert.equal(isWriterEntryActive({ pid: null, status: 'running' }), false);
});
test('retry backoff is 0 / 30s / 120s', () => {
  assert.equal(RETRY_BACKOFF_MS[0], 0);
  assert.equal(RETRY_BACKOFF_MS[1], 30_000);
  assert.equal(RETRY_BACKOFF_MS[2], 120_000);
  assert.equal(backoffAfterFailureMs(1), 30_000);
  assert.equal(backoffAfterFailureMs(2), 120_000);
  assert.equal(backoffAfterFailureMs(3), null);
});

test('after three failures task becomes blocked with no next retry', () => {
  let task = { id: 'T', status: 'ready', retryCount: 0, result: {} };
  for (let i = 0; i < MAX_AUTO_ATTEMPTS; i += 1) {
    task = { ...task, ...buildFailurePatch(task, { exitCode: 1, error: 'fail' }) };
  }
  assert.equal(task.status, 'blocked');
  assert.equal(task.nextRetryAt, null);
  assert.equal(task.blockingReason, 'fail');
  assert.equal(canAttemptTask(task).ok, false);
});

test('AWAITING_TASK_RUNNER does not spawn a child process', async () => {
  const { dispatchTaskWriter, loadActiveWriters, saveActiveWriters } = await import('../src/dispatch.mjs');
  const before = loadActiveWriters();
  const writersBefore = { ...(before.writers || {}) };
  // Ensure durable queue row is ready so canAttemptTask reaches the awaiting-runner gate
  const prev = getTask('library', 'L-SYN-DEP');
  updateTask('library', 'L-SYN-DEP', {
    status: 'ready',
    blockingReason: null,
    nextRetryAt: null,
    result: { reason: 'AWAITING_TASK_RUNNER' },
    humanGate: false
  });
  const task = {
    id: 'L-SYN-DEP',
    lane: 'library',
    status: 'ready',
    result: { reason: 'AWAITING_TASK_RUNNER' },
    humanGate: false
  };
  const res = dispatchTaskWriter('library', task, { maxHeavy: 2 });
  assert.equal(res.ok, false);
  assert.equal(res.spawned, false);
  assert.equal(res.reason, 'AWAITING_TASK_RUNNER');
  saveActiveWriters({ updatedAt: new Date().toISOString(), writers: writersBefore });
  if (prev) {
    updateTask('library', 'L-SYN-DEP', {
      status: prev.status,
      blockingReason: prev.blockingReason || null,
      result: prev.result,
      humanGate: prev.humanGate
    });
  }
});

test('integrated tasks are not dispatched', () => {
  for (const [lane, id] of [
    ['singy', 'S-010'],
    ['arranger', 'A-020'],
    ['library', 'L-010'],
    ['library', 'L-020'],
    ['library', 'L-030']
  ]) {
    const t = getTask(lane, id);
    assert.ok(t, id);
    assert.ok(isTerminalSuccessStatus(t.status), `${id} should be integrated/passed`);
    assert.equal(canAttemptTask(t).ok, false);
  }
  const pick = pickNextLaneWork({});
  if (pick.action === 'run') {
    assert.ok(!['S-010', 'A-020', 'L-010', 'L-020', 'L-030', 'S-020'].includes(pick.task.id));
  }
});

test('one task cannot be dispatched twice while lane writer alive', async () => {
  const { dispatchTaskWriter, loadActiveWriters, saveActiveWriters } = await import('../src/dispatch.mjs');
  const active = loadActiveWriters();
  active.writers = active.writers || {};
  active.writers.library = {
    lane: 'library',
    taskId: 'L-040',
    pid: process.pid,
    heavy: true,
    status: 'running'
  };
  saveActiveWriters(active);
  const res = dispatchTaskWriter('library', { id: 'L-040', lane: 'library', status: 'ready' }, { maxHeavy: 2 });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'lane_already_has_writer');
  const cleaned = loadActiveWriters();
  delete cleaned.writers.library;
  saveActiveWriters(cleaned);
});

test('no 10-second relaunch: backoff gate blocks early retry', () => {
  const task = {
    id: 'X',
    status: 'retry',
    retryCount: 1,
    nextRetryAt: new Date(Date.now() + 60_000).toISOString(),
    result: {}
  };
  const gate = canAttemptTask(task);
  assert.equal(gate.ok, false);
  assert.equal(gate.reason, 'BACKOFF_WAIT');
});

test('failing runner spawn uses hidden node child (no PowerShell)', async () => {
  const logFile = path.join(FACTORY_ROOT, 'logs', 'test-hidden-spawn.log');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const { spawnWriterProcess } = await import('../src/writer-adapters.mjs');
  const script = path.join(FACTORY_ROOT, 'src', 'cli.mjs');
  const spawned = spawnWriterProcess({
    agentId: 'cursor-local',
    cwd: FACTORY_ROOT,
    prompt: '',
    logFile,
    localRunner: script,
    localArgs: ['status']
  });
  assert.ok(spawned.pid);
  assert.equal(spawned.command, process.execPath);
  // wait briefly for exit
  const end = Date.now() + 5000;
  while (Date.now() < end) {
    try {
      process.kill(spawned.pid, 0);
    } catch {
      break;
    }
  }
});

test('max heavy writers is at least 2 when RAM >= 4GB', () => {
  const r = evaluateResources();
  if (r.ram.freeGb >= 4) {
    assert.ok(effectiveMaxHeavyWriters(r) >= 2);
  }
});

test('dashboard host config is localhost only', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(FACTORY_ROOT, 'config', 'factory.json'), 'utf8'));
  assert.equal(cfg.dashboardHost, '127.0.0.1');
});

test('state JSON remains valid after failure patch write', () => {
  const p = path.join(FACTORY_ROOT, 'state', 'retry-policy-shape.json');
  const patch = buildFailurePatch({ retryCount: 2, result: {} }, { exitCode: 7, error: 'boom' });
  atomicWriteJson(p, patch);
  const got = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(got.status, 'blocked');
  assert.equal(got.lastExitCode, 7);
  fs.unlinkSync(p);
});

test('blocked-once patch for writer auth does not schedule automatic retry', () => {
  const patch = buildBlockedOncePatch({ result: {} }, 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI', 'no spawn');
  assert.equal(patch.status, 'blocked');
  assert.equal(patch.nextRetryAt, null);
  assert.equal(patch.result.nextAutomaticRetry, null);
});

test('safe stop terminates owned children helper', async () => {
  const { terminateOwnedWriters, countOwnedAliveWriters, loadActiveWriters, saveActiveWriters } =
    await import('../src/dispatch.mjs');
  const active = loadActiveWriters();
  const prev = { ...(active.writers || {}) };
  // Use a short-lived hidden child we own
  const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {
    ...hiddenSpawnOptions(['ignore', 'ignore', 'ignore']),
    detached: true
  });
  child.unref();
  active.writers = {
    singy: { lane: 'singy', taskId: 'S-TEST', pid: child.pid, heavy: true, status: 'running' }
  };
  saveActiveWriters(active);
  assert.ok(countOwnedAliveWriters() >= 1);
  const killed = terminateOwnedWriters();
  assert.ok(killed.some((k) => k.pid === child.pid));
  assert.equal(countOwnedAliveWriters(), 0);
  saveActiveWriters({ updatedAt: new Date().toISOString(), writers: prev });
});
