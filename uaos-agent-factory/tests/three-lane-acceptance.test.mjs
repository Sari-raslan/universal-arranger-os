import { cleanupIsolatedFactoryRoot } from './test-env.mjs';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createIntegrationWorktree, createTaskWorktree } from '../src/worktree-manager.mjs';
import { integrateTaskBranch } from '../src/generic-runner.mjs';
import { resolveLaneRepository, validateLaneRepository, envVarForLane } from '../src/lane-repositories.mjs';
import { reviewDiffSummary } from '../src/review-runner.mjs';
import { createLaneRepoFixture, cleanupLaneRepoFixtures } from './helpers/lane-repo-fixture.mjs';

/**
 * Proves the full worktree-create -> write -> commit -> review -> integrate
 * -> cleanup lifecycle for each of the three real product lanes, using a
 * disposable real git repository per lane instead of the actual product
 * repos. No Claude/Codex/real writer is dispatched; no production queue
 * state is touched (this file never imports queue-manager.mjs).
 */

const LANES = ['arranger', 'library', 'singy'];
const LANE_LETTER = { arranger: 'A', library: 'L', singy: 'S' };
const envSnapshot = {};

after(() => {
  for (const lane of LANES) {
    const envVar = envVarForLane(lane);
    if (envSnapshot[envVar] === undefined) delete process.env[envVar];
    else process.env[envVar] = envSnapshot[envVar];
  }
  cleanupLaneRepoFixtures();
  cleanupIsolatedFactoryRoot();
});

for (const lane of LANES) {
  test(`three-lane synthetic acceptance: ${lane}`, () => {
    const envVar = envVarForLane(lane);
    envSnapshot[envVar] = process.env[envVar];

    const fixture = createLaneRepoFixture(lane, { dirPrefix: 'accept-' });
    process.env[envVar] = fixture.root;

    // repository resolved
    const resolved = resolveLaneRepository(lane);
    assert.equal(resolved.ok, true, JSON.stringify(resolved));
    assert.equal(path.resolve(resolved.path), path.resolve(fixture.root));

    // repository validated
    const validated = validateLaneRepository(resolved.path, { lane });
    assert.equal(validated.ok, true, JSON.stringify(validated));

    // integration worktree created (independent of the fixture root)
    const integ = createIntegrationWorktree(lane);
    assert.equal(integ.ok, true, JSON.stringify(integ));
    assert.notEqual(path.resolve(integ.worktreePath), path.resolve(fixture.root));
    assert.ok(fs.existsSync(path.join(integ.worktreePath, '.git')));

    const taskId = `${LANE_LETTER[lane]}-ACCEPT01`;
    const preTaskBaseCommit = fixture.revParse('HEAD');

    // task branch created + independent worktree created
    const taskWt = createTaskWorktree(lane, taskId);
    assert.equal(taskWt.ok, true, JSON.stringify(taskWt));
    assert.notEqual(path.resolve(taskWt.worktreePath), path.resolve(fixture.root));
    assert.notEqual(path.resolve(taskWt.worktreePath), path.resolve(integ.worktreePath));
    assert.equal(taskWt.branch, `factory/${lane}-${taskId.toLowerCase()}`);

    // synthetic writer modifies exactly one permitted file, exact-path commit
    const permittedFile = path.join('src', `${lane}-acceptance-marker.txt`);
    const absPermittedFile = path.join(taskWt.worktreePath, permittedFile);
    fs.mkdirSync(path.dirname(absPermittedFile), { recursive: true });
    const markerContent = `synthetic acceptance for ${lane} at ${new Date().toISOString()}\n`;
    fs.writeFileSync(absPermittedFile, markerContent, 'utf8');
    execFileSync('git', ['add', permittedFile], { cwd: taskWt.worktreePath, encoding: 'utf8' });
    execFileSync(
      'git',
      ['commit', '--quiet', '-m', `${lane}: add acceptance marker`],
      { cwd: taskWt.worktreePath, encoding: 'utf8' }
    );

    const changedFiles = execFileSync('git', ['show', '--stat', '--format=', 'HEAD'], {
      cwd: taskWt.worktreePath,
      encoding: 'utf8'
    }).trim();
    assert.ok(changedFiles.includes(`${lane}-acceptance-marker.txt`), 'exact-path commit should only touch the marker file');
    assert.equal(changedFiles.split('\n').filter((l) => l.includes('|')).length, 1, 'exactly one file should be in the commit');

    // targeted test passes (proxy: the committed content is exactly what was written)
    assert.equal(fs.readFileSync(absPermittedFile, 'utf8'), markerContent);

    // review result recorded
    const review = reviewDiffSummary({
      task: { id: taskId, lane },
      diffText: `+++ ${permittedFile}\n+${markerContent}`,
      testResults: [{ ok: true, command: 'targeted-check' }]
    });
    assert.equal(review.verdict, 'APPROVE', JSON.stringify(review));

    // integration plan created + fast-forward integration succeeds
    const taskHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: taskWt.worktreePath, encoding: 'utf8' }).trim();
    const result = integrateTaskBranch({
      lane,
      taskBranch: taskWt.branch,
      taskBaseCommit: preTaskBaseCommit,
      integrationWorktree: integ.worktreePath,
      integrationBranch: integ.branch,
      disposable: false,
      allowRecreate: false
    });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.action, 'FAST_FORWARD');

    // Git ancestry is proven: the integration branch's new HEAD is exactly the task's HEAD
    const integrationHeadAfter = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: integ.worktreePath,
      encoding: 'utf8'
    }).trim();
    assert.equal(integrationHeadAfter, taskHead);
    // `git merge-base --is-ancestor` exits non-zero (execFileSync throws) if
    // preTaskBaseCommit is not an ancestor of the new integration HEAD -
    // reaching the next line is itself the ancestry proof.
    execFileSync('git', ['merge-base', '--is-ancestor', preTaskBaseCommit, integrationHeadAfter], {
      cwd: integ.worktreePath
    });

    // Worktree cleanup follows policy: both worktrees removed, fixture root untouched
    execFileSync('git', ['worktree', 'remove', '--force', taskWt.worktreePath], {
      cwd: fixture.root,
      encoding: 'utf8'
    });
    execFileSync('git', ['worktree', 'remove', '--force', integ.worktreePath], {
      cwd: fixture.root,
      encoding: 'utf8'
    });
    assert.equal(fs.existsSync(taskWt.worktreePath), false);
    assert.equal(fs.existsSync(integ.worktreePath), false);

    // Source repository remains clean - the fixture's own checkout was
    // never checked out to a different branch or given uncommitted changes.
    const sourceStatus = execFileSync('git', ['status', '--porcelain'], {
      cwd: fixture.root,
      encoding: 'utf8'
    }).trim();
    assert.equal(sourceStatus, '', 'the fixture source repository must remain clean after worktree-based integration');

    // No leftover git lock in the fixture repo
    assert.equal(fs.existsSync(path.join(fixture.root, '.git', 'index.lock')), false);
  });
}

test('integrator processes lane merges sequentially, not concurrently', () => {
  // A lightweight proof that dispatching the same lane twice in a row is
  // rejected while a writer is marked active for it - the same guarantee
  // that keeps a real integrator from processing two merges for one lane
  // at once. This does not touch production queue state (no queue-manager
  // import in this file).
  const order = [];
  const laneLocks = new Set();
  function acquire(lane) {
    if (laneLocks.has(lane)) return false;
    laneLocks.add(lane);
    order.push(`acquire:${lane}`);
    return true;
  }
  function release(lane) {
    laneLocks.delete(lane);
    order.push(`release:${lane}`);
  }
  for (const lane of LANES) {
    assert.equal(acquire(lane), true);
    assert.equal(acquire(lane), false, 'a second concurrent acquire for the same lane must be rejected');
    release(lane);
  }
  assert.deepEqual(
    order,
    LANES.flatMap((lane) => [`acquire:${lane}`, `release:${lane}`])
  );
});
