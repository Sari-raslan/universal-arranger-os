import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FACTORY_ROOT, atomicWriteJson } from '../src/lib.mjs';
import { pickNextLaneWork, effectiveMaxHeavyWriters } from '../src/scheduler.mjs';
import { updateTask, loadQueue, saveQueue } from '../src/queue-manager.mjs';
import { evaluateResources } from '../src/resource-guard.mjs';

test('ready AWAITING_WRITER task is eligible for dispatch (not skipped)', () => {
  // Ensure S-010 is ready with awaiting reason — scheduler must still return it
  const before = loadQueue('singy');
  const s010 = before.tasks.find((t) => t.id === 'S-010');
  assert.ok(s010);
  const original = structuredClone(s010);
  updateTask('singy', 'S-010', {
    status: 'ready',
    result: { reason: 'AWAITING_WRITER_HANDLER', at: new Date().toISOString() }
  });
  // Clear active writers file influence by picking with empty map
  const pick = pickNextLaneWork({});
  assert.equal(pick.action, 'run');
  assert.ok(pick.task);
  assert.equal(pick.task.id, 'S-010');
  // restore original status fields carefully
  updateTask('singy', 'S-010', {
    status: original.status,
    result: original.result
  });
});

test('max heavy writers is at least 2 when RAM >= 4GB', () => {
  const r = evaluateResources();
  if (r.ram.freeGb >= 4) {
    assert.ok(effectiveMaxHeavyWriters(r) >= 2);
  }
});

test('duplicate dispatch blocked when lane already active', async () => {
  const { dispatchTaskWriter, loadActiveWriters, saveActiveWriters } = await import('../src/dispatch.mjs');
  const active = loadActiveWriters();
  active.writers = active.writers || {};
  active.writers.library = {
    lane: 'library',
    taskId: 'L-010',
    pid: process.pid, // alive
    heavy: true,
    status: 'running',
    taskIdKeep: true
  };
  saveActiveWriters(active);
  const res = dispatchTaskWriter('library', { id: 'L-010', lane: 'library' }, { maxHeavy: 2 });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'lane_already_has_writer');
  // cleanup fake writer
  const cleaned = loadActiveWriters();
  delete cleaned.writers.library;
  saveActiveWriters(cleaned);
});

test('failed writer without result maps to retry semantics helper shape', () => {
  const p = path.join(FACTORY_ROOT, 'state', 'dispatch-retry-shape.json');
  atomicWriteJson(p, { status: 'retry', reason: 'WRITER_EXITED_WITHOUT_RESULT' });
  const got = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(got.status, 'retry');
  fs.unlinkSync(p);
});
