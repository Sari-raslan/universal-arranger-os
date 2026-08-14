import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  createDisposableSyntheticRepos,
  planIntegration,
  executeIntegrationPlan,
  revParse,
  isAncestor,
  gitIn,
  syntheticRepoRoot,
  attemptSafeRebase
} from '../src/integration-planner.mjs';

function advanceIntegration(iso) {
  // Simulate product lane advancing integration while task is in progress
  fs.writeFileSync(path.join(iso.integrationWorktree, 'PRODUCT.txt'), 'advanced\n', 'utf8');
  gitIn(iso.integrationWorktree, ['add', 'PRODUCT.txt']);
  gitIn(iso.integrationWorktree, [
    '-c',
    'user.email=uaos-factory@local',
    '-c',
    'user.name=UAOS Factory',
    'commit',
    '-m',
    'product advance'
  ]);
  return revParse(iso.integrationWorktree, 'HEAD');
}

test('disposable synthetic repos never live under product worktree root', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-ISO-1' });
  assert.equal(iso.disposable, true);
  assert.ok(iso.root.startsWith(syntheticRepoRoot()));
  assert.ok(!iso.root.toLowerCase().includes('uaos_agent_factory_worktrees'));
  assert.ok(!iso.root.toLowerCase().includes('uaos-real-product'));
  assert.ok(fs.existsSync(iso.taskWorktree));
  assert.ok(fs.existsSync(iso.integrationWorktree));
  assert.ok(iso.taskBaseCommit);
});

test('normal fast-forward integrate', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-FF' });
  fs.writeFileSync(path.join(iso.taskWorktree, 'UAOS_GENERIC_MARKER.txt'), 'PASS\n', 'utf8');
  gitIn(iso.taskWorktree, ['add', 'UAOS_GENERIC_MARKER.txt']);
  gitIn(iso.taskWorktree, [
    '-c',
    'user.email=uaos-factory@local',
    '-c',
    'user.name=UAOS Factory',
    'commit',
    '-m',
    'task'
  ]);
  const plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: iso.taskBaseCommit
  });
  assert.equal(plan.action, 'FAST_FORWARD');
  const exec = executeIntegrationPlan(iso.integrationWorktree, plan, {
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch
  });
  assert.equal(exec.ok, true);
  assert.ok(isAncestor(iso.integrationWorktree, iso.taskBaseCommit, revParse(iso.integrationWorktree, 'HEAD')));
});

test('integration head advanced blocks silent integrate', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-ADV' });
  fs.writeFileSync(path.join(iso.taskWorktree, 'UAOS_GENERIC_MARKER.txt'), 'PASS\n', 'utf8');
  gitIn(iso.taskWorktree, ['add', 'UAOS_GENERIC_MARKER.txt']);
  gitIn(iso.taskWorktree, [
    '-c',
    'user.email=uaos-factory@local',
    '-c',
    'user.name=UAOS Factory',
    'commit',
    '-m',
    'task'
  ]);
  const newHead = advanceIntegration(iso);
  const plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: iso.taskBaseCommit
  });
  assert.equal(plan.action, 'INTEGRATION_HEAD_ADVANCED');
  assert.equal(plan.ok, false);
  assert.equal(plan.preserveTaskWorktree, true);
  assert.equal(plan.integrationHead, newHead);
  const exec = executeIntegrationPlan(iso.integrationWorktree, plan, {
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch
  });
  assert.equal(exec.ok, false);
  assert.equal(exec.reason, 'INTEGRATION_HEAD_ADVANCED');
});

test('attemptSafeRebase recovers cleanly from a non-conflicting integration head advance', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-REBASE-OK' });
  fs.writeFileSync(path.join(iso.taskWorktree, 'TASK_ONLY.txt'), 'task change\n', 'utf8');
  gitIn(iso.taskWorktree, ['add', 'TASK_ONLY.txt']);
  gitIn(iso.taskWorktree, [
    '-c', 'user.email=uaos-factory@local', '-c', 'user.name=UAOS Factory', 'commit', '-m', 'task'
  ]);
  const preRebaseTaskHead = revParse(iso.taskWorktree, 'HEAD');

  const newIntegHead = advanceIntegration(iso); // touches PRODUCT.txt — a different, non-conflicting file

  let plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: iso.taskBaseCommit
  });
  assert.equal(plan.action, 'INTEGRATION_HEAD_ADVANCED');

  const rebase = attemptSafeRebase(iso.taskWorktree, { taskBranch: iso.taskBranch, newBase: newIntegHead });
  assert.equal(rebase.ok, true);
  assert.equal(rebase.reason, 'REBASED_CLEAN');
  assert.notEqual(rebase.newTaskHead, preRebaseTaskHead);
  assert.ok(fs.existsSync(path.join(iso.taskWorktree, 'TASK_ONLY.txt')));
  assert.ok(
    fs.existsSync(path.join(iso.taskWorktree, 'PRODUCT.txt')),
    'rebased task branch should now also contain the advanced product change'
  );

  // Recovery must actually unblock integration afterward, with the product change intact.
  plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: rebase.taskBaseCommit
  });
  assert.equal(plan.action, 'FAST_FORWARD');
  const exec = executeIntegrationPlan(iso.integrationWorktree, plan, {
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch
  });
  assert.equal(exec.ok, true);
  assert.ok(
    fs.existsSync(path.join(iso.integrationWorktree, 'TASK_ONLY.txt')),
    'the task change must survive the recovered integration — no product work lost'
  );
});

test('attemptSafeRebase aborts cleanly and preserves everything on a real conflict', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-REBASE-CONFLICT' });
  fs.writeFileSync(path.join(iso.taskWorktree, 'SAME_PATH.txt'), 'task version\n', 'utf8');
  gitIn(iso.taskWorktree, ['add', 'SAME_PATH.txt']);
  gitIn(iso.taskWorktree, [
    '-c', 'user.email=uaos-factory@local', '-c', 'user.name=UAOS Factory', 'commit', '-m', 'task conflicting change'
  ]);
  const preRebaseTaskHead = revParse(iso.taskWorktree, 'HEAD');

  fs.writeFileSync(path.join(iso.integrationWorktree, 'SAME_PATH.txt'), 'integration version\n', 'utf8');
  gitIn(iso.integrationWorktree, ['add', 'SAME_PATH.txt']);
  gitIn(iso.integrationWorktree, [
    '-c', 'user.email=uaos-factory@local', '-c', 'user.name=UAOS Factory', 'commit', '-m', 'product conflicting change'
  ]);
  const newIntegHead = revParse(iso.integrationWorktree, 'HEAD');

  const rebase = attemptSafeRebase(iso.taskWorktree, { taskBranch: iso.taskBranch, newBase: newIntegHead });
  assert.equal(rebase.ok, false);
  assert.equal(rebase.reason, 'REBASE_CONFLICT');

  // Worktree must be back exactly where it was — no half-applied rebase, no lost commit, no force merge.
  const status = gitIn(iso.taskWorktree, ['status', '--porcelain']);
  assert.equal(status.stdout.trim(), '');
  assert.equal(revParse(iso.taskWorktree, 'HEAD'), preRebaseTaskHead);
  // Compare content ignoring line-ending normalization — Windows git (core.autocrlf) may
  // rewrite LF to CRLF on checkout; that's a platform detail, not something this test asserts.
  assert.equal(
    fs.readFileSync(path.join(iso.taskWorktree, 'SAME_PATH.txt'), 'utf8').replace(/\r\n/g, '\n'),
    'task version\n'
  );
});

test('stale task base detected', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-STALE' });
  const fakeBase = '0123456789abcdef0123456789abcdef01234567';
  const plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: fakeBase
  });
  assert.equal(plan.ok, false);
  assert.ok(['STALE_OR_REWRITTEN_TASK_BASE', 'TASK_BASE_MISSING'].includes(plan.action) || plan.reason);
});

test('task branch missing base', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-NOBASE' });
  const plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: null
  });
  assert.equal(plan.action, 'TASK_BASE_MISSING');
  assert.equal(plan.ok, false);
});

test('already integrated task', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-DONE' });
  const plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: iso.taskBaseCommit,
    alreadyIntegrated: true
  });
  assert.equal(plan.action, 'ALREADY_INTEGRATED');
  assert.equal(plan.ok, true);
});

test('duplicate integration attempt is idempotent when heads equal', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-DUP' });
  // no task commits — task head == integration head after checkout equality via same base branch tip
  // Make task point at same commit as integration by not committing
  const integ = revParse(iso.integrationWorktree, iso.integrationBranch);
  const taskH = revParse(iso.integrationWorktree, iso.taskBranch);
  assert.equal(integ, taskH);
  const plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: iso.taskBaseCommit
  });
  assert.equal(plan.action, 'ALREADY_INTEGRATED');
});

test('interrupted integration recovery preserves worktree flag', () => {
  const iso = createDisposableSyntheticRepos({ taskId: 'L-SYN-INT' });
  fs.writeFileSync(path.join(iso.taskWorktree, 'UAOS_GENERIC_MARKER.txt'), 'PASS\n', 'utf8');
  gitIn(iso.taskWorktree, ['add', 'UAOS_GENERIC_MARKER.txt']);
  gitIn(iso.taskWorktree, [
    '-c',
    'user.email=uaos-factory@local',
    '-c',
    'user.name=UAOS Factory',
    'commit',
    '-m',
    'task'
  ]);
  advanceIntegration(iso);
  const plan = planIntegration({
    cwd: iso.integrationWorktree,
    integrationBranch: iso.integrationBranch,
    taskBranch: iso.taskBranch,
    taskBaseCommit: iso.taskBaseCommit
  });
  assert.equal(plan.preserveTaskWorktree, true);
  assert.ok(fs.existsSync(iso.taskWorktree));
  assert.ok(fs.existsSync(path.join(iso.taskWorktree, 'UAOS_GENERIC_MARKER.txt')));
});
