import { cleanupIsolatedFactoryRoot } from './test-env.mjs';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FACTORY_ROOT,
  atomicWriteJson,
  readJson,
  containsForbiddenCommand,
  sha256File
} from '../src/lib.mjs';

after(cleanupIsolatedFactoryRoot);
import { loadQueue, dependenciesSatisfied, nextRunnableTask, saveQueue } from '../src/queue-manager.mjs';
import { securityScanPayload } from '../src/security-guard.mjs';
import { evaluateResources } from '../src/resource-guard.mjs';
import { reviewDiffSummary } from '../src/review-runner.mjs';

test('queue dependency gating', () => {
  const q = loadQueue('singy');
  const s020 = q.tasks.find((t) => t.id === 'S-020');
  assert.ok(s020);
  const s010 = q.tasks.find((t) => t.id === 'S-001');
  assert.ok(s010);
  // S-020 depends on S-010; if S-010 is integrated/passed, deps are satisfied
  const clone = structuredClone(q);
  const s010task = clone.tasks.find((t) => t.id === 'S-010');
  s010task.status = 'pending';
  assert.equal(dependenciesSatisfied(s020, clone), false);
  s010task.status = 'integrated';
  assert.equal(dependenciesSatisfied(s020, clone), true);
});

test('atomic write json', () => {
  const p = path.join(FACTORY_ROOT, 'state', 'test-atomic.json');
  atomicWriteJson(p, { ok: true, n: 1 });
  const got = readJson(p);
  assert.equal(got.ok, true);
  fs.unlinkSync(p);
});

test('forbidden command scan', () => {
  assert.ok(containsForbiddenCommand('git push origin master').includes('git push'));
  assert.equal(containsForbiddenCommand('npm test').length, 0);
});

test('secret and path leak scan', () => {
  const bad = securityScanPayload('sk_live_ABCDEFghijklmnop and C:\\Users\\ssare\\secret');
  assert.equal(bad.ok, false);
  assert.ok(bad.pathLeaks.length >= 1);
});

test('resource throttling object shape', () => {
  const r = evaluateResources();
  assert.ok(r.limits);
  assert.ok('maxHeavyWriters' in r.limits);
});

test('artifact hash', () => {
  const p = path.join(FACTORY_ROOT, 'state', 'hash-fixture.txt');
  fs.writeFileSync(p, 'uaos-factory-hash\n');
  const h = sha256File(p);
  assert.equal(h.length, 64);
  fs.unlinkSync(p);
});

test('reviewer rejection on failed tests', () => {
  const rev = reviewDiffSummary({
    task: { id: 'X', lane: 'singy' },
    diffText: 'safe',
    testResults: [{ ok: false, command: 'npm test' }]
  });
  assert.equal(rev.verdict, 'REJECT');
});

test('next runnable prefers highest priority pending with deps met', () => {
  const q = loadQueue('singy');
  const next = nextRunnableTask('singy');
  // May be null when next ready tasks are writer-blocked / backoff
  if (next) {
    assert.ok(!['S-010', 'S-020', 'S-001'].includes(next.id) || next.status !== 'integrated');
    assert.ok(next.priority >= 700);
  }
  assert.ok(q.tasks.length > 3);
});

test('integrated Singy/Library/Arranger milestones stay ineligible', () => {
  for (const id of ['S-010', 'S-020']) {
    const t = loadQueue('singy').tasks.find((x) => x.id === id);
    assert.equal(t.status, 'integrated');
  }
  assert.equal(loadQueue('arranger').tasks.find((t) => t.id === 'A-020').status, 'integrated');
  for (const id of ['L-010', 'L-020', 'L-030']) {
    assert.equal(loadQueue('library').tasks.find((t) => t.id === id).status, 'integrated');
  }
});

test('lane isolation: queues are separate files', () => {
  assert.notEqual(
    path.basename(path.join(FACTORY_ROOT, 'queues', 'singy.queue.json')),
    path.basename(path.join(FACTORY_ROOT, 'queues', 'arranger.queue.json'))
  );
  assert.equal(loadQueue('singy').lane, 'singy');
  assert.equal(loadQueue('arranger').lane, 'arranger');
  assert.equal(loadQueue('library').lane, 'library');
});

test('stale lock recovery pattern', () => {
  const lock = path.join(FACTORY_ROOT, 'state', 'test.lock');
  atomicWriteJson(lock, { pid: 99999999, acquiredAt: new Date().toISOString() });
  assert.ok(fs.existsSync(lock));
  fs.renameSync(lock, `${lock}.stale.${Date.now()}`);
  assert.equal(fs.existsSync(lock), false);
});
