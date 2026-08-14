import './test-env.mjs';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FACTORY_ROOT, atomicWriteJson, readJson } from '../src/lib.mjs';
import { getTask, updateTask, loadQueue, saveQueue } from '../src/queue-manager.mjs';
import {
  claimTaskCursorLocal,
  interruptClaim,
  reconcileStaleClaims
} from '../src/cursor-local-claim.mjs';
import { loadActiveWriters, saveActiveWriters } from '../src/dispatch.mjs';
import { isolateLaneRepo, cleanupIsolatedFactoryRoot, REAL_FACTORY_ROOT } from './test-env.mjs';
import { cleanupLaneRepoFixtures } from './helpers/lane-repo-fixture.mjs';

// Dedicated fixture on the singy lane specifically — every other test file that exercises
// claimTaskCursorLocal uses the library lane, and acquireClaimLock() is scoped per-lane, not
// per-task-ID, so a distinct fixture ID alone doesn't avoid contention on the same lane's lock
// under Node's default parallel test execution. Singy has no other claim-lock traffic at all.
//
// This is a disposable local git repo standing in for Singy for this test only (via
// isolateLaneRepo's env-var override) - nothing here reads, claims, or reasons about the real
// Singy checkout or its live externally-owned lane status; that's a separate, unrelated
// concern (the 24x7 controller's own EXTERNAL_OWNERSHIP policy), not something a local unit
// test touches at all.
const LANE = 'singy';
const SYN = 'S-SYN-SUPERVISOR';
const CLAIMS_PATH = path.join(FACTORY_ROOT, 'state', 'cursor-local-claims.json');

before(async () => {
  await isolateLaneRepo(LANE);
});

after(() => {
  cleanupLaneRepoFixtures();
  cleanupIsolatedFactoryRoot();
});

before(() => {
  const q = loadQueue(LANE);
  if (!q.tasks.find((t) => t.id === SYN)) {
    q.tasks.push({
      id: SYN,
      lane: LANE,
      title: 'Synthetic supervisor-wiring proof',
      priority: 1,
      status: 'ready',
      dependsOn: [],
      humanGate: false,
      commands: { tests: [] },
      result: null,
      claimId: null,
      executionMode: null,
      writerPid: null
    });
    saveQueue(LANE, q);
  } else {
    updateTask(LANE, SYN, {
      status: 'ready',
      claimId: null,
      executionMode: null,
      writerPid: null,
      blockingReason: null
    });
  }
});

function restoreSyn(patch) {
  updateTask(LANE, SYN, patch);
}

// reconcileStaleClaims() itself is exercised behaviorally here (no dispatch risk — this
// calls only the claim-store function directly). Wiring it into the real supervisor loop
// is verified separately, structurally, below — NOT by executing runSupervisorLoop(), since
// that function's tick() also unconditionally calls resumeInterrupted() (which flips any
// 'running' task to 'retry', a dispatch-eligible status) and then pickNextLaneWork/
// dispatchTaskWriter. If anything in the queue happened to become eligible, that would
// attempt a real `git worktree add` against this lane's actual repoRoot — a real, shared
// repository, not something an isolated/disposable test queue protects against, since the
// repo path comes from config, independent of which queue copy is driving the scheduler.
// That's not a safe thing to risk from an automated test.
test('reconcileStaleClaims recovers a claim whose heartbeat has gone silent past the threshold', () => {
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null, blockingReason: null });
  const aw = loadActiveWriters();
  delete aw.writers?.[LANE];
  saveActiveWriters(aw);

  let claimId = null;
  try {
    const claim = claimTaskCursorLocal(LANE, SYN);
    assert.equal(claim.ok, true);
    claimId = claim.claim.claimId;

    // Simulate 31 minutes of heartbeat silence (threshold is 30 minutes) by backdating the
    // claim record directly — this is the same file claimTaskCursorLocal itself just wrote to.
    const claims = readJson(CLAIMS_PATH, { claims: {} });
    const key = Object.keys(claims.claims).find((k) => claims.claims[k].claimId === claimId);
    assert.ok(key, 'claim record must exist in the claims store');
    const staleAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    claims.claims[key].claimedAt = staleAt;
    claims.claims[key].heartbeatAt = staleAt;
    atomicWriteJson(CLAIMS_PATH, claims);

    const changes = reconcileStaleClaims();
    assert.ok(
      changes.some((c) => c.lane === LANE && c.taskId === SYN && c.ok),
      `expected a recorded recovery for ${LANE}/${SYN}, got ${JSON.stringify(changes)}`
    );

    const after = getTask(LANE, SYN);
    assert.equal(after.status, 'blocked');
    assert.equal(after.blockingReason, 'CURSOR_LOCAL_CLAIM_STALE_HEARTBEAT');
    claimId = null; // already resolved by reconcileStaleClaims — nothing left to interrupt
  } finally {
    if (claimId) interruptClaim(LANE, SYN, { claimId });
    restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null, blockingReason: null });
    const cleaned = loadActiveWriters();
    delete cleaned.writers?.[LANE];
    saveActiveWriters(cleaned);
  }
});

test('reconcileStaleClaims leaves a freshly-heartbeated claim untouched', () => {
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null, blockingReason: null });
  const aw = loadActiveWriters();
  delete aw.writers?.[LANE];
  saveActiveWriters(aw);

  let claimId = null;
  try {
    const claim = claimTaskCursorLocal(LANE, SYN);
    assert.equal(claim.ok, true);
    claimId = claim.claim.claimId;

    const changes = reconcileStaleClaims();
    assert.ok(
      !changes.some((c) => c.lane === LANE && c.taskId === SYN),
      'a claim heartbeated moments ago must not be recovered as stale'
    );
    assert.equal(getTask(LANE, SYN).status, 'running');
  } finally {
    if (claimId) interruptClaim(LANE, SYN, { claimId });
    restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null, blockingReason: null });
    const cleaned = loadActiveWriters();
    delete cleaned.writers?.[LANE];
    saveActiveWriters(cleaned);
  }
});

test('supervisor.mjs wires reconcileStaleClaims into the real tick, before any dispatch decision', () => {
  // This reads the actual committed source's text for a structural check — not something to
  // run — so it deliberately uses REAL_FACTORY_ROOT, not the isolated FACTORY_ROOT, which has
  // no src/ directory at all.
  const src = fs.readFileSync(path.join(REAL_FACTORY_ROOT, 'src', 'supervisor.mjs'), 'utf8');

  assert.match(
    src,
    /import\s*\{\s*reconcileStaleClaims\s*\}\s*from\s*['"]\.\/cursor-local-claim\.mjs['"]/,
    'supervisor.mjs must import reconcileStaleClaims from cursor-local-claim.mjs'
  );

  const tickStart = src.indexOf('const tick = async () => {');
  assert.ok(tickStart !== -1, 'tick() must exist as a named const inside runSupervisorLoop');
  const tickBody = src.slice(tickStart);

  const callIdx = tickBody.indexOf('reconcileStaleClaims()');
  const pauseCheckIdx = tickBody.indexOf('fs.existsSync(PAUSE_PATH)');
  const dispatchIdx = tickBody.indexOf('pickNextLaneWork(live)');

  assert.ok(callIdx !== -1, 'tick() must call reconcileStaleClaims()');
  assert.ok(pauseCheckIdx !== -1 && dispatchIdx !== -1, 'expected tick() structure not found — has supervisor.mjs changed shape?');
  assert.ok(
    callIdx > pauseCheckIdx,
    'reconcileStaleClaims() must run after the global-pause early-return, so a paused factory never touches claim state'
  );
  assert.ok(
    callIdx < dispatchIdx,
    'reconcileStaleClaims() must run before the scheduler picks work, so a just-recovered task is visible to that same tick\'s dispatch decision'
  );
});
