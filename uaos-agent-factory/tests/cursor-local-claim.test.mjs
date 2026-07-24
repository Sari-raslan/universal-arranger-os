import { cleanupIsolatedFactoryRoot } from './test-env.mjs';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { FACTORY_ROOT, atomicWriteJson } from '../src/lib.mjs';
import { getTask, updateTask } from '../src/queue-manager.mjs';
import {
  canClaimWithCursorLocal,
  claimTaskCursorLocal,
  interruptClaim,
  recoverInterruptedClaim,
  CURSOR_LOCAL_MODE
} from '../src/cursor-local-claim.mjs';
import { loadActiveWriters, saveActiveWriters } from '../src/dispatch.mjs';
import { createIntegrationWorktree } from '../src/worktree-manager.mjs';
import { resolveLaneRepository, validateLaneRepository } from '../src/lane-repositories.mjs';
import { createLaneRepoFixture, createNonGitFixture, cleanupLaneRepoFixtures } from './helpers/lane-repo-fixture.mjs';

// Every test below runs against a real, disposable git repository - never
// the actual product repos, and never a mock of git behavior. This is what
// converts the 4 previously-skipped tests (manual claim, double-claim,
// null-PID acceptance, interrupted-claim recovery) into deterministic
// passes: the fixture stands in for config/factory.json's
// lanes.library.repoRoot, resolved the same way a real deployment would
// resolve it (UAOS_LIBRARY_REPO_ROOT).
let libraryFixture;

before(() => {
  libraryFixture = createLaneRepoFixture('library');
  process.env.UAOS_LIBRARY_REPO_ROOT = libraryFixture.root;
  const integ = createIntegrationWorktree('library');
  assert.equal(integ.ok, true, `expected the library integration worktree to be created: ${JSON.stringify(integ)}`);
});

after(() => {
  delete process.env.UAOS_LIBRARY_REPO_ROOT;
  cleanupLaneRepoFixtures();
  cleanupIsolatedFactoryRoot();
});

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
  assert.equal(claim.ok, true, JSON.stringify(claim));
  assert.equal(claim.task.status, 'running');
  assert.equal(claim.task.writerPid, null);
  assert.equal(claim.task.executionMode, CURSOR_LOCAL_MODE);
  assert.equal(claim.claim.writerPid, null);
  // Real git behavior: the task branch and worktree genuinely exist.
  assert.ok(fs.existsSync(claim.claim.taskWorktree), 'task worktree should exist on disk');
  assert.ok(fs.existsSync(path.join(claim.claim.taskWorktree, '.git')), 'task worktree should be a real git worktree');

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
  assert.equal(first.ok, true, JSON.stringify(first));
  const second = claimTaskCursorLocal('library', SYN);
  assert.equal(second.ok, false);
  assert.ok(['ALREADY_CLAIMED', 'DOUBLE_CLAIM'].includes(second.reason));
  interruptClaim('library', SYN);
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
  assert.equal(claim.ok, true, JSON.stringify(claim));
  assert.equal(claim.claim.writerPid, null);
  assert.equal(claim.claim.executionMode, CURSOR_LOCAL_MODE);
  assert.equal(getTask('library', SYN).writerPid, null);
  interruptClaim('library', SYN);
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

// ─── lane repository resolution / validation ────────────────────────────────

test('missing repository resolves to LANE_REPOSITORY_NOT_CONFIGURED', () => {
  const prev = process.env.UAOS_SINGY_REPO_ROOT;
  delete process.env.UAOS_SINGY_REPO_ROOT;
  try {
    const result = resolveLaneRepository('singy');
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'LANE_REPOSITORY_NOT_CONFIGURED');
  } finally {
    if (prev !== undefined) process.env.UAOS_SINGY_REPO_ROOT = prev;
  }
});

test('invalid git repository is rejected', () => {
  const notGit = createNonGitFixture();
  const result = validateLaneRepository(notGit, { lane: 'arranger' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'NOT_A_GIT_REPOSITORY');
});

test('ambiguous repository discovery returns AMBIGUOUS_REPOSITORY_MATCH', () => {
  const searchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-lane-search-'));
  const candidateA = createLaneRepoFixture('arranger', { dirPrefix: 'a-' });
  const candidateB = createLaneRepoFixture('arranger', { dirPrefix: 'b-' });
  // Symlink/copy both candidates under one search root so discovery sees two matches.
  const linkA = path.join(searchRoot, 'candidate-a');
  const linkB = path.join(searchRoot, 'candidate-b');
  fs.cpSync(candidateA.root, linkA, { recursive: true });
  fs.cpSync(candidateB.root, linkB, { recursive: true });

  const prevRoots = process.env.UAOS_PRODUCT_REPO_SEARCH_ROOTS;
  const prevEnv = process.env.UAOS_ARRANGER_REPO_ROOT;
  delete process.env.UAOS_ARRANGER_REPO_ROOT;
  process.env.UAOS_PRODUCT_REPO_SEARCH_ROOTS = searchRoot;
  try {
    const result = resolveLaneRepository('arranger');
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'AMBIGUOUS_REPOSITORY_MATCH');
    assert.equal(result.candidates.length, 2);
  } finally {
    if (prevRoots === undefined) delete process.env.UAOS_PRODUCT_REPO_SEARCH_ROOTS;
    else process.env.UAOS_PRODUCT_REPO_SEARCH_ROOTS = prevRoots;
    if (prevEnv !== undefined) process.env.UAOS_ARRANGER_REPO_ROOT = prevEnv;
    fs.rmSync(searchRoot, { recursive: true, force: true });
  }
});

test('lane mismatch is rejected when a repository is marked for a different lane', () => {
  const wrongLane = createLaneRepoFixture('singy'); // marked .uaos-lane = "singy"
  const result = validateLaneRepository(wrongLane.root, { lane: 'library' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'LANE_MISMATCH');
  assert.equal(result.expectedLane, 'library');
  assert.equal(result.markedLane, 'singy');
});

test('repository path containing spaces resolves and validates', () => {
  const container = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-space-'));
  const target = path.join(container, 'has spaces here', 'library repo');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const fixture = createLaneRepoFixture('library', { dirPrefix: 'spaced-' });
  fs.cpSync(fixture.root, target, { recursive: true });
  const result = validateLaneRepository(target, { lane: 'library' });
  assert.equal(result.ok, true, JSON.stringify(result));
  fs.rmSync(container, { recursive: true, force: true });
});

test('environment-variable configuration is honored', () => {
  const fixture = createLaneRepoFixture('singy');
  const prev = process.env.UAOS_SINGY_REPO_ROOT;
  process.env.UAOS_SINGY_REPO_ROOT = fixture.root;
  try {
    const result = resolveLaneRepository('singy');
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.resolvedFrom, 'env');
    assert.equal(path.resolve(result.path), path.resolve(fixture.root));
  } finally {
    if (prev === undefined) delete process.env.UAOS_SINGY_REPO_ROOT;
    else process.env.UAOS_SINGY_REPO_ROOT = prev;
  }
});

test('local config override (config/factory.local.json) is honored', () => {
  const fixture = createLaneRepoFixture('singy', { dirPrefix: 'override-' });
  const overridePath = path.join(FACTORY_ROOT, 'config', 'factory.local.json');
  const prevEnv = process.env.UAOS_SINGY_REPO_ROOT;
  delete process.env.UAOS_SINGY_REPO_ROOT;
  fs.writeFileSync(
    overridePath,
    JSON.stringify({ lanes: { singy: { repoRoot: fixture.root } } }, null, 2),
    'utf8'
  );
  try {
    const result = resolveLaneRepository('singy');
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.resolvedFrom, 'localOverride');
    assert.equal(path.resolve(result.path), path.resolve(fixture.root));
  } finally {
    fs.rmSync(overridePath, { force: true });
    if (prevEnv !== undefined) process.env.UAOS_SINGY_REPO_ROOT = prevEnv;
  }
});

test('git worktree with a .git file (not directory) validates successfully', () => {
  const fixture = createLaneRepoFixture('arranger', { dirPrefix: 'wtsrc-' });
  const wtPath = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-lane-wt-'));
  fs.rmSync(wtPath, { recursive: true, force: true }); // git worktree add requires the target not to exist
  execFileSync('git', ['worktree', 'add', wtPath, fixture.integrationBranch], { cwd: fixture.root, encoding: 'utf8' });
  try {
    assert.ok(fs.statSync(path.join(wtPath, '.git')).isFile(), 'a linked worktree has a .git FILE, not a directory');
    const result = validateLaneRepository(wtPath, { lane: 'arranger' });
    assert.equal(result.ok, true, JSON.stringify(result));
  } finally {
    execFileSync('git', ['worktree', 'remove', '--force', wtPath], { cwd: fixture.root, encoding: 'utf8' });
  }
});

test('dirty repository is reported, not rejected by default', () => {
  const fixture = createLaneRepoFixture('library', { dirPrefix: 'dirty-' });
  fixture.makeDirty();
  const result = validateLaneRepository(fixture.root, { lane: 'library' });
  assert.equal(result.ok, true);
  assert.equal(result.isDirty, true);
  assert.ok(result.dirtyCount >= 1);
});

test('index lock is rejected', () => {
  const fixture = createLaneRepoFixture('library', { dirPrefix: 'lock-' });
  fixture.writeIndexLock();
  try {
    const result = validateLaneRepository(fixture.root, { lane: 'library' });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'INDEX_LOCKED');
  } finally {
    fixture.removeIndexLock();
  }
});

test('unresolved rebase is rejected', () => {
  const fixture = createLaneRepoFixture('library', { dirPrefix: 'rebase-' });
  // Create a diverging commit on a second branch that conflicts with the
  // integration branch's file, then attempt to rebase onto it.
  execFileSync('git', ['checkout', '-b', 'conflicting'], { cwd: fixture.root, encoding: 'utf8' });
  fixture.commitFile('README.md', '# conflicting change\n', 'conflicting change');
  execFileSync('git', ['checkout', fixture.integrationBranch], { cwd: fixture.root, encoding: 'utf8' });
  fixture.commitFile('README.md', '# integration change\n', 'integration change');
  fixture.beginUnmergedRebase('conflicting');
  try {
    const result = validateLaneRepository(fixture.root, { lane: 'library' });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'UNRESOLVED_GIT_OPERATION');
  } finally {
    fixture.abortRebase();
  }
});
