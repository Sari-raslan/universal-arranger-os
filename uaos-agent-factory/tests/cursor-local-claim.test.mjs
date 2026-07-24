import { cleanupIsolatedFactoryRoot } from './test-env.mjs';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { FACTORY_ROOT, atomicWriteJson, loadFactoryConfig } from '../src/lib.mjs';
import { getTask, updateTask } from '../src/queue-manager.mjs';
import {
  canClaimWithCursorLocal,
  claimTaskCursorLocal,
  interruptClaim,
  recoverInterruptedClaim,
  completeClaimIntegrated,
  CURSOR_LOCAL_MODE
} from '../src/cursor-local-claim.mjs';
import { loadActiveWriters, saveActiveWriters } from '../src/dispatch.mjs';

after(cleanupIsolatedFactoryRoot);

const SYN = 'L-SYN-DEP';

// claimTaskCursorLocal ultimately runs `git worktree add` against the real
// uaos-real-product repo (config/factory.json's lanes.library.repoRoot) -
// a separate repository this checkout does not and cannot contain. That
// makes these tests inherently environment-conditional, not a portability
// bug in the Agent Factory itself: see AGENT_FACTORY_PATH_DEPENDENCY_MATRIX_LATEST.csv.
const realProductRepo = loadFactoryConfig().lanes.library.repoRoot;
const realProductRepoMissing = !fs.existsSync(realProductRepo);
const skipReason = realProductRepoMissing
  ? `real product repo not present at ${realProductRepo} - claim tests need an actual git worktree to branch from`
  : false;

function restoreSyn(patch) {
  updateTask('library', SYN, patch);
}

test('manual claim ready task (synthetic)', { skip: skipReason }, () => {
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
  interruptClaim('library', SYN);
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

test('cannot double-claim', { skip: skipReason }, () => {
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
  interruptClaim('library', SYN);
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const cleaned = loadActiveWriters();
  delete cleaned.writers?.library;
  saveActiveWriters(cleaned);
});

test('null PID accepted only for cursor-local interactive execution', { skip: skipReason }, () => {
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
  interruptClaim('library', SYN);
  restoreSyn({ status: 'ready', claimId: null, executionMode: null });
  const cleaned = loadActiveWriters();
  delete cleaned.writers?.library;
  saveActiveWriters(cleaned);
});

test('interrupted claim recovery', { skip: skipReason }, () => {
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
  assert.equal(claimTaskCursorLocal('library', SYN).ok, true);
  assert.equal(interruptClaim('library', SYN).ok, true);
  assert.equal(getTask('library', SYN).status, 'interrupted');
  const recovered = recoverInterruptedClaim('library', SYN);
  assert.equal(recovered.ok, true);
  assert.equal(recovered.task.status, 'running');
  interruptClaim('library', SYN);
  restoreSyn({ status: 'ready', claimId: null, executionMode: null, statusKeep: true });
  updateTask('library', SYN, { status: 'ready', claimId: null, executionMode: null, writerPid: null });
  const cleaned = loadActiveWriters();
  delete cleaned.writers?.library;
  saveActiveWriters(cleaned);
});

test('state remains valid after claim lifecycle write', () => {
  const p = path.join(FACTORY_ROOT, 'state', 'cursor-local-claims.json');
  atomicWriteJson(p, { updatedAt: new Date().toISOString(), claims: {} });
  const got = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.equal(typeof got.claims, 'object');
});
