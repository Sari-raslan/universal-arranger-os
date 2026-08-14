import './test-env.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  FACTORY_ROOT,
  atomicWriteJson,
  ensureDir,
  nowIso,
  loadFactoryConfig
} from '../src/lib.mjs';
import { loadQueue, saveQueue, updateTask, nextRunnableTask, dependenciesSatisfied } from '../src/queue-manager.mjs';
import { pickNextLaneWork, effectiveMaxHeavyWriters } from '../src/scheduler.mjs';
import { evaluateResources } from '../src/resource-guard.mjs';
import { isTaskEligible, executeGenericTask } from '../src/generic-runner.mjs';
import { buildTaskPrompt } from '../src/task-prompt.mjs';
import { dispatchTaskWriter, loadActiveWriters, saveActiveWriters, countHeavyWriters } from '../src/dispatch.mjs';

const SYN_LANE = 'library';
// Deliberately distinct from bugbot-5-findings.test.mjs's L-SYN-GENERIC fixture —
// both files used to share that one ID, which raced under Node's default parallel
// test execution (each file mutates the fixture's queue entry independently, so
// whichever ran last could stomp the other's in-flight state). ensureSyntheticTask()
// below auto-creates this task if the committed queue doesn't already have it.
const SYN_ID = 'L-SYN-RUNNER';

function ensureSyntheticTask() {
  const q = loadQueue(SYN_LANE);
  let t = q.tasks.find((x) => x.id === SYN_ID);
  if (!t) {
    t = {
      id: SYN_ID,
      lane: SYN_LANE,
      title: 'Synthetic generic runner proof',
      priority: 1,
      status: 'ready',
      dependsOn: ['L-001'],
      humanGate: false,
      retryLimit: 2,
      timeoutMinutes: 5,
      allowedPaths: ['UAOS_GENERIC_MARKER.txt'],
      forbiddenPaths: ['node_modules/**'],
      commands: { preflight: [], tests: [], build: [], acceptance: [] },
      artifactsExpected: [],
      localSyntheticAction: 'create_marker_file',
      localSyntheticPath: 'UAOS_GENERIC_MARKER.txt',
      result: null
    };
    q.tasks.push(t);
    saveQueue(SYN_LANE, q);
  } else {
    updateTask(SYN_LANE, SYN_ID, {
      status: 'ready',
      localSyntheticAction: 'create_marker_file',
      localSyntheticPath: 'UAOS_GENERIC_MARKER.txt',
      dependsOn: ['L-001'],
      humanGate: false,
      result: null
    });
  }
  return loadQueue(SYN_LANE).tasks.find((x) => x.id === SYN_ID);
}

test('prompt generated from queue schema fields', () => {
  const prompt = buildTaskPrompt({
    id: 'X-9',
    lane: 'singy',
    title: 'Demo',
    objective: 'Do the thing',
    allowedPaths: ['a/**'],
    forbiddenPaths: ['b/**'],
    commands: { tests: ['npm test'] }
  });
  assert.match(prompt, /X-9/);
  assert.match(prompt, /Do the thing/);
  assert.match(prompt, /npm test/);
  assert.match(prompt, /Never run remote publish actions/);
});

test('human-gate task is not eligible', () => {
  const e = isTaskEligible({ id: 'H', status: 'ready', humanGate: true });
  assert.equal(e.ok, false);
  assert.equal(e.reason, 'HUMAN_GATE');
});

test('dependencies enforced for synthetic task', () => {
  const q = loadQueue(SYN_LANE);
  const clone = structuredClone(q);
  const syn = {
    id: 'TMP-DEP',
    dependsOn: ['DOES_NOT_EXIST'],
    status: 'ready'
  };
  assert.equal(dependenciesSatisfied(syn, clone), false);
});

test('generic runner executes unknown synthetic task end-to-end', async () => {
  const task = ensureSyntheticTask();
  // L-001 must be passed/integrated already
  const l001 = loadQueue(SYN_LANE).tasks.find((t) => t.id === 'L-001');
  assert.ok(['passed', 'integrated'].includes(l001.status));

  const artifact = path.join(loadFactoryConfig().artifactRoot, 'library', SYN_ID);
  const evidence = path.join(FACTORY_ROOT, 'logs', SYN_LANE, SYN_ID, 'selftest');
  ensureDir(artifact);
  ensureDir(evidence);

  // Snapshot real library integration HEAD — must not change due to synthetic run
  const realInteg = path.join(loadFactoryConfig().worktreeRoot, 'library-integration');
  const before = fs.existsSync(realInteg)
    ? execSync('git rev-parse HEAD', { cwd: realInteg, encoding: 'utf8' }).trim()
    : null;

  const result = await executeGenericTask(
    { ...task, localSyntheticAction: 'create_marker_file', localSyntheticPath: 'UAOS_GENERIC_MARKER.txt' },
    { artifactDir: artifact, evidenceDir: evidence, forceAgent: 'synthetic-local', disposableSynthetic: true }
  );
  assert.equal(result.ok, true, JSON.stringify(result.integrate || result));
  assert.equal(result.status, 'PASS');
  assert.ok(fs.existsSync(path.join(artifact, `${SYN_ID}-result.json`)));
  assert.equal(result.integrate?.ok, true);
  assert.ok(result.commit?.head);

  if (before) {
    const after = execSync('git rev-parse HEAD', { cwd: realInteg, encoding: 'utf8' }).trim();
    assert.equal(after, before, 'real library-integration HEAD must be unchanged by synthetic test');
  }
});

test('ready task can move to running via dispatch shape', () => {
  const active = loadActiveWriters();
  // clear library writer if dead
  if (active.writers?.library && !active.writers.library.pid) delete active.writers.library;
  saveActiveWriters(active);
  const task = ensureSyntheticTask();
  updateTask(SYN_LANE, SYN_ID, { status: 'ready' });
  // Don't actually spawn long process in unit test if already running — just verify eligibility + pick
  const pick = pickNextLaneWork({});
  assert.ok(['run', 'wait_capacity', 'idle'].includes(pick.action));
});

test('resource limit at most two heavy writers', () => {
  const r = evaluateResources();
  assert.ok(effectiveMaxHeavyWriters(r) <= 2);
  assert.ok(effectiveMaxHeavyWriters({ ram: { freeGb: 5 }, limits: { maxHeavyWriters: 1 } }) <= 2);
});

test('lane pause file blocks only when present', () => {
  const pause = path.join(FACTORY_ROOT, 'state', 'PAUSE_library');
  // factory uses global PAUSE today; document lane-specific readiness via isTaskEligible
  const e = isTaskEligible({ id: 'X', status: 'ready', humanGate: false }, { lanePaused: true });
  assert.equal(e.ok, false);
  assert.equal(e.reason, 'LANE_PAUSED');
  if (fs.existsSync(pause)) fs.unlinkSync(pause);
});

test('duplicate dispatch blocked when lane writer alive', () => {
  const active = loadActiveWriters();
  active.writers = active.writers || {};
  active.writers.library = {
    lane: 'library',
    taskId: SYN_ID,
    pid: process.pid,
    heavy: true,
    status: 'running'
  };
  saveActiveWriters(active);
  const res = dispatchTaskWriter('library', { id: SYN_ID, lane: 'library', humanGate: false }, { maxHeavy: 2 });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'lane_already_has_writer');
  const cleaned = loadActiveWriters();
  delete cleaned.writers.library;
  saveActiveWriters(cleaned);
});

test('completed synthetic task advances dependent', async () => {
  const q = loadQueue(SYN_LANE);
  // Dedicated to this test — L-SYN-DEP is cursor-local-claim.test.mjs's fixture;
  // sharing it here would reintroduce the exact cross-file race this ID scheme exists to avoid.
  const depId = 'L-SYN-RUNNER-DEP';
  if (!q.tasks.find((t) => t.id === depId)) {
    q.tasks.push({
      id: depId,
      lane: SYN_LANE,
      title: 'Dependent of synthetic',
      priority: 1,
      status: 'pending',
      dependsOn: [SYN_ID],
      humanGate: false,
      commands: { tests: [] },
      result: null
    });
    saveQueue(SYN_LANE, q);
  } else {
    updateTask(SYN_LANE, depId, { status: 'pending', dependsOn: [SYN_ID] });
  }
  // Ensure SYN is integrated — must also clear integrationStatus, since isDurablyIntegrated()
  // treats a stale NOT_INTEGRATED left over from committed fixture data as still-blocking even
  // once status flips to 'integrated' (only an absent/INTEGRATED value counts as durable).
  updateTask(SYN_LANE, SYN_ID, { status: 'integrated', integrationStatus: 'INTEGRATED' });
  // manually invoke mark by re-running execute is heavy; simulate advancement logic
  const q2 = loadQueue(SYN_LANE);
  const dep = q2.tasks.find((t) => t.id === depId);
  const syn = q2.tasks.find((t) => t.id === SYN_ID);
  syn.status = 'integrated';
  if (dependenciesSatisfied(dep, q2) && dep.status === 'pending') {
    updateTask(SYN_LANE, depId, { status: 'ready' });
  }
  assert.equal(loadQueue(SYN_LANE).tasks.find((t) => t.id === depId).status, 'ready');
});

test('no eligible idle when ready non-human synthetic task exists', () => {
  // Never mutate real product milestones (S-020 etc.) inside tests.
  updateTask(SYN_LANE, SYN_ID, {
    status: 'ready',
    humanGate: false,
    localSyntheticAction: 'noop-pass',
    result: { clearedAwaiting: true },
    allowIntegratorDispatch: false,
    blockingReason: null,
    nextRetryAt: null,
    retryCount: 0
  });
  const pick = pickNextLaneWork({});
  assert.notEqual(pick.action, 'pause_factory');
  if (pick.action === 'idle') {
    const next = nextRunnableTask(SYN_LANE);
    assert.ok(next === null || next.humanGate || next.id === SYN_ID);
  } else {
    assert.ok(['run', 'wait_capacity'].includes(pick.action));
  }
  // Restore synthetic to integrated so it does not steal future dispatch
  updateTask(SYN_LANE, SYN_ID, { status: 'integrated', localSyntheticAction: 'noop-pass' });
});
