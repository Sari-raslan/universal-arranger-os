import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FACTORY_ROOT, atomicWriteJson, isSyntheticTaskId } from '../src/lib.mjs';
import { getTask, updateTask, nextRunnableTask, loadQueue } from '../src/queue-manager.mjs';
import { writeMasterStatus } from '../src/reporter.mjs';
import {
  canClaimWithCursorLocal,
  claimTaskCursorLocal,
  interruptClaim,
  recoverInterruptedClaim,
  completeClaimIntegrated,
  heartbeatClaim,
  markClaimPhase,
  CURSOR_LOCAL_MODE
} from '../src/cursor-local-claim.mjs';
import { loadActiveWriters, saveActiveWriters, reconcileWriterExits } from '../src/dispatch.mjs';

const SYN = 'L-SYN-DEP';

function restoreSyn(patch) {
  updateTask('library', SYN, patch);
}

test('manual claim ready task (synthetic)', () => {
  const before = getTask('library', SYN);
  restoreSyn({
    status: 'ready',
    blockingReason: null,
    claimId: null,
    executionMode: null,
    writerPid: null,
    result: { reason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI' },
    allowIntegratorDispatch: false,
    nextRetryAt: null,
    retryCount: 0
  });
  // Clear lane writer
  const aw = loadActiveWriters();
  delete aw.writers?.library;
  saveActiveWriters(aw);

  const gate = canClaimWithCursorLocal(getTask('library', SYN));
  assert.equal(gate.ok, true);
  const claim = claimTaskCursorLocal('library', SYN);
  assert.equal(claim.ok, true);
  assert.equal(claim.task.status, 'running');
  assert.equal(claim.task.writerPid, null);
  assert.equal(claim.task.executionMode, CURSOR_LOCAL_MODE);
  assert.equal(claim.claim.writerPid, null);

  // cleanup — mark interrupted then restore prior-ish state
  interruptClaim('library', SYN, { claimId: claim.claim.claimId });
  restoreSyn({
    status: before.status === 'running' ? 'ready' : before.status,
    claimId: null,
    executionMode: null,
    writerPid: null,
    result: before.result,
    blockingReason: before.blockingReason || null
  });
  const cleaned = loadActiveWriters();
  delete cleaned.writers?.library;
  saveActiveWriters(cleaned);
});

test('manual claim writer-blocked task', () => {
  const a040 = getTask('arranger', 'A-040');
  assert.ok(a040);
  // Do not mutate A-040 permanently if already claimed later — snapshot
  if (a040.status === 'integrated' || a040.status === 'running') {
    assert.ok(true);
    return;
  }
  assert.ok(
    a040.status === 'blocked' || a040.result?.reason === 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI'
  );
  const gate = canClaimWithCursorLocal(a040);
  assert.equal(gate.ok, true);
});

test('cannot claim integrated task', () => {
  const t = getTask('arranger', 'A-030');
  assert.equal(t.status, 'integrated');
  const gate = canClaimWithCursorLocal(t);
  assert.equal(gate.ok, false);
  assert.equal(gate.reason, 'ALREADY_COMPLETE');
  const res = claimTaskCursorLocal('arranger', 'A-030');
  assert.equal(res.ok, false);
});

test('cannot double-claim', () => {
  restoreSyn({
    status: 'ready',
    blockingReason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI',
    result: { reason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI' },
    claimId: null,
    executionMode: null,
    writerPid: null,
    nextRetryAt: null
  });
  const aw = loadActiveWriters();
  delete aw.writers?.library;
  saveActiveWriters(aw);
  const first = claimTaskCursorLocal('library', SYN);
  assert.equal(first.ok, true);
  const second = claimTaskCursorLocal('library', SYN);
  assert.equal(second.ok, false);
  assert.ok(['ALREADY_CLAIMED', 'DOUBLE_CLAIM'].includes(second.reason));
  interruptClaim('library', SYN, { claimId: first.claim.claimId });
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const cleaned = loadActiveWriters();
  delete cleaned.writers?.library;
  saveActiveWriters(cleaned);
});

test('null PID accepted only for cursor-local interactive execution', () => {
  restoreSyn({
    status: 'ready',
    result: { reason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI' },
    blockingReason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI',
    claimId: null,
    executionMode: null,
    nextRetryAt: null
  });
  const aw = loadActiveWriters();
  delete aw.writers?.library;
  saveActiveWriters(aw);
  const claim = claimTaskCursorLocal('library', SYN);
  assert.equal(claim.ok, true);
  assert.equal(claim.claim.writerPid, null);
  assert.equal(claim.claim.executionMode, CURSOR_LOCAL_MODE);
  assert.equal(getTask('library', SYN).writerPid, null);
  interruptClaim('library', SYN, { claimId: claim.claim.claimId });
  restoreSyn({ status: 'ready', claimId: null, executionMode: null });
  const cleaned = loadActiveWriters();
  delete cleaned.writers?.library;
  saveActiveWriters(cleaned);
});

test('interrupted claim recovery', () => {
  restoreSyn({
    status: 'ready',
    result: { reason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI' },
    blockingReason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI',
    claimId: null,
    executionMode: null,
    nextRetryAt: null
  });
  const aw = loadActiveWriters();
  delete aw.writers?.library;
  saveActiveWriters(aw);
  const initial = claimTaskCursorLocal('library', SYN);
  assert.equal(initial.ok, true);
  assert.equal(interruptClaim('library', SYN, { claimId: initial.claim.claimId }).ok, true);
  assert.equal(getTask('library', SYN).status, 'interrupted');
  const recovered = recoverInterruptedClaim('library', SYN);
  assert.equal(recovered.ok, true);
  assert.equal(recovered.task.status, 'running');
  interruptClaim('library', SYN, { claimId: recovered.claim.claimId });
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, statusKeep: true });
  updateTask('library', SYN, { status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const cleaned = loadActiveWriters();
  delete cleaned.writers?.library;
  saveActiveWriters(cleaned);
});

test('atomic lane claim lock blocks a concurrent live owner', () => {
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const lockDir = path.join(FACTORY_ROOT, 'state', 'claim-locks');
  const lockPath = path.join(lockDir, 'library.lock');
  fs.mkdirSync(lockDir, { recursive: true });
  fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, lane: 'library' }));
  try {
    const blocked = claimTaskCursorLocal('library', SYN);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.reason, 'ATOMIC_CLAIM_LOCKED');
    assert.equal(getTask('library', SYN).status, 'ready');
  } finally {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  }
});

test('atomic lane claim lock safely recovers a dead owner', () => {
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const aw = loadActiveWriters();
  delete aw.writers?.library;
  saveActiveWriters(aw);
  const lockDir = path.join(FACTORY_ROOT, 'state', 'claim-locks');
  const lockPath = path.join(lockDir, 'library.lock');
  fs.mkdirSync(lockDir, { recursive: true });
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 2147483647, lane: 'library' }));
  const claim = claimTaskCursorLocal('library', SYN);
  assert.equal(claim.ok, true);
  assert.equal(interruptClaim('library', SYN, { claimId: claim.claim.claimId }).ok, true);
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
  for (const name of fs.readdirSync(lockDir)) {
    if (name.startsWith('library.lock.stale.')) fs.unlinkSync(path.join(lockDir, name));
  }
});
test('lease mutators reject missing and wrong claim IDs', () => {
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const aw = loadActiveWriters();
  delete aw.writers?.library;
  saveActiveWriters(aw);
  const claim = claimTaskCursorLocal('library', SYN);
  assert.equal(claim.ok, true);
  assert.equal(markClaimPhase('library', SYN, 'testing').reason, 'CLAIM_ID_MISMATCH');
  assert.equal(markClaimPhase('library', SYN, 'testing', {}, { claimId: 'wrong' }).reason, 'CLAIM_ID_MISMATCH');
  assert.equal(getTask('library', SYN).status, 'running');
  assert.equal(interruptClaim('library', SYN, { claimId: claim.claim.claimId }).ok, true);
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
});

test('heartbeat requires ownership and refreshes the active lease', () => {
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const aw = loadActiveWriters();
  delete aw.writers?.library;
  saveActiveWriters(aw);
  const claim = claimTaskCursorLocal('library', SYN);
  assert.equal(claim.ok, true);
  assert.equal(heartbeatClaim('library', SYN, 'wrong').reason, 'CLAIM_ID_MISMATCH');
  const beat = heartbeatClaim('library', SYN, claim.claim.claimId);
  assert.equal(beat.ok, true);
  assert.ok(Date.parse(beat.heartbeatAt) >= Date.parse(claim.claim.claimedAt));
  assert.equal(interruptClaim('library', SYN, { claimId: claim.claim.claimId }).ok, true);
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
});
test('completeClaimIntegrated refuses to mark a task integrated without an explicit testsPass:true', () => {
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const aw = loadActiveWriters();
  delete aw.writers?.library;
  saveActiveWriters(aw);
  const claim = claimTaskCursorLocal('library', SYN);
  assert.equal(claim.ok, true);
  try {
    // Omitting testsPass must be treated as failure, not success — a writer that never proved
    // it passed can never be recorded as PASS/integrated merely because a caller called this.
    const omitted = completeClaimIntegrated('library', SYN, { commit: 'deadbeef', claimId: claim.claim.claimId });
    assert.equal(omitted.ok, false);
    assert.equal(omitted.reason, 'TESTS_NOT_PASSED');
    assert.notEqual(getTask('library', SYN).status, 'integrated');

    const explicitFalse = completeClaimIntegrated('library', SYN, {
      commit: 'deadbeef',
      testsPass: false,
      claimId: claim.claim.claimId
    });
    assert.equal(explicitFalse.ok, false);
    assert.equal(explicitFalse.reason, 'TESTS_NOT_PASSED');
    assert.notEqual(getTask('library', SYN).status, 'integrated');

    // A genuine, explicit testsPass:true still succeeds — the fix only closes the silent-default gap.
    const genuine = completeClaimIntegrated('library', SYN, {
      commit: 'deadbeef',
      testsPass: true,
      claimId: claim.claim.claimId
    });
    assert.equal(genuine.ok, true);
    assert.equal(getTask('library', SYN).status, 'integrated');
    assert.equal(getTask('library', SYN).result.status, 'PASS');
  } finally {
    restoreSyn({
      status: 'ready',
      claimId: null,
      executionMode: null,
      writerPid: null,
      blockingReason: 'MEGA_PRODUCTION_MODE_SYNTHETIC_QUARANTINED'
    });
    const cleaned = loadActiveWriters();
    delete cleaned.writers?.library;
    saveActiveWriters(cleaned);
  }
});

test('a specific integration failure reason survives reconcileWriterExits instead of collapsing to WRITER_FAIL', () => {
  // Co-located with the other L-SYN-DEP-claim tests in this file (rather than dispatch.test.mjs)
  // deliberately: node --test runs files in parallel but tests within one file sequentially, and
  // this fixture task has no per-test isolation of its own — splitting cross-file caused a real,
  // observed race against this file's other claim tests.
  const priorTask = getTask('library', SYN);
  const priorAw = loadActiveWriters();
  const priorWriters = { ...(priorAw.writers || {}) };

  const artifactDir = path.join(FACTORY_ROOT, 'state', 'artifacts', 'library', SYN);
  fs.mkdirSync(artifactDir, { recursive: true });
  const resultPath = path.join(artifactDir, `${SYN}-result.json`);
  fs.writeFileSync(
    resultPath,
    JSON.stringify({
      status: 'FAIL',
      ok: false,
      integrate: { ok: false, reason: 'INTEGRATION_HEAD_ADVANCED', taskBaseCommit: 'aaa', integrationHead: 'bbb' }
    }),
    'utf8'
  );

  updateTask('library', SYN, { status: 'running', writerPid: null, retryCount: 0, blockingReason: null });
  const aw = loadActiveWriters();
  aw.writers = aw.writers || {};
  aw.writers.library = {
    pid: 2147483647, // established "definitely dead" sentinel used elsewhere in this file
    taskId: SYN,
    status: 'running',
    artifactDir,
    evidenceDir: artifactDir
  };
  saveActiveWriters(aw);

  try {
    reconcileWriterExits();
    const after = getTask('library', SYN);
    // A first failure goes to status:'retry' with the reason recorded in lastError — blockingReason
    // is only set once retries are exhausted (see retry-policy's buildFailurePatch). lastError is
    // set unconditionally on every failure, so it's the direct, minimal probe for this fix.
    assert.equal(after.lastError, 'INTEGRATION_HEAD_ADVANCED');
    assert.notEqual(after.lastError, 'WRITER_FAIL');
  } finally {
    fs.rmSync(artifactDir, { recursive: true, force: true });
    const cleanAw = loadActiveWriters();
    cleanAw.writers = priorWriters;
    saveActiveWriters(cleanAw);
    updateTask('library', SYN, {
      status: priorTask?.status || 'ready',
      blockingReason: priorTask?.blockingReason ?? 'MEGA_PRODUCTION_MODE_SYNTHETIC_QUARANTINED',
      retryCount: priorTask?.retryCount ?? 0,
      writerPid: null
    });
  }
});

test('nextRunnableTask never selects the synthetic fixture task, even when made maximally eligible', () => {
  const before = getTask('library', SYN);
  updateTask('library', SYN, {
    status: 'ready',
    priority: 999999, // deliberately more attractive than every real task, to prove the filter — not luck — excludes it
    dependsOn: [],
    blockingReason: null,
    nextRetryAt: null,
    retryCount: 0
  });
  try {
    const picked = nextRunnableTask('library');
    assert.notEqual(picked?.id, SYN);
  } finally {
    restoreSyn({
      status: before.status,
      priority: before.priority,
      dependsOn: before.dependsOn,
      blockingReason: before.blockingReason,
      nextRetryAt: before.nextRetryAt,
      retryCount: before.retryCount
    });
  }
});

test('writeMasterStatus never surfaces the synthetic fixture as the current lane task or counts it', () => {
  const before = getTask('library', SYN);
  // waiting_human is exactly the status that previously made this fixture win the naive
  // Array.find() in reporter.mjs, since it was the only library task carrying that status.
  updateTask('library', SYN, { status: 'waiting_human' });
  try {
    const payload = writeMasterStatus();
    const q = loadQueue('library');
    const realTaskCount = q.tasks.filter((t) => !isSyntheticTaskId(t.id)).length;
    assert.notEqual(payload.lanes.library.currentTask, SYN);
    assert.equal(payload.lanes.library.total, realTaskCount);
    assert.ok(
      !payload.lanes.library.blockers.some((b) => b.id === SYN),
      'synthetic fixture must not appear in the human-facing blockers list either'
    );
  } finally {
    restoreSyn({ status: before.status, blockingReason: before.blockingReason });
  }
});

test('state remains valid after claim lifecycle write', () => {
  const p = path.join(FACTORY_ROOT, 'state', 'cursor-local-claims.json');
  atomicWriteJson(p, { updatedAt: new Date().toISOString(), claims: {} });
  const got = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(typeof got.claims, 'object');
});
