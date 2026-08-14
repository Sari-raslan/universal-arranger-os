import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  FACTORY_ROOT,
  ensureDir,
  atomicWriteJson,
  nowIso,
  runCmd,
  loadFactoryConfig,
  readJson,
  isPidAlive,
  isSyntheticTaskId
} from './lib.mjs';
import { writePromptFiles } from './task-prompt.mjs';
import { createTaskWorktree } from './worktree-manager.mjs';
import { assertSafeCommands } from './security-guard.mjs';
import { reviewDiffSummary } from './review-runner.mjs';
import { updateTask, loadQueue, saveQueue, isDurablyIntegrated, transitionTask } from './queue-manager.mjs';
import {
  preferredWriterForLane,
  isWriterAvailable,
  spawnWriterProcess
} from './writer-adapters.mjs';
import {
  createDisposableSyntheticRepos,
  planIntegration,
  executeIntegrationPlan,
  revParse,
  recordTaskBaseCommit,
  tryRecreateIntegrationWorktree,
  attemptSafeRebase
} from './integration-planner.mjs';

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--') && i + 1 < argv.length) {
      out[a.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

function runTimed(cmd, { cwd, timeoutMs = 300000, env = {} } = {}) {
  assertSafeCommands([cmd]);
  const r = spawnSync(cmd, {
    cwd,
    shell: true,
    encoding: 'utf8',
    timeout: timeoutMs,
    env: {
      ...process.env,
      ...env,
      TEMP: path.join(FACTORY_ROOT, 'state', 'tmp'),
      TMP: path.join(FACTORY_ROOT, 'state', 'tmp')
    }
  });
  return {
    command: cmd,
    exitCode: r.status ?? (r.error ? 1 : 0),
    ok: (r.status ?? 1) === 0 && !r.error,
    stdoutTail: (r.stdout || '').slice(-4000),
    stderrTail: ((r.stderr || '') + (r.error ? String(r.error.message) : '')).slice(-4000)
  };
}

function listChangedFiles(cwd) {
  const st = runCmd('git status --porcelain', { cwd });
  return (st.stdout || '')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/^"|"$/g, ''))
    .filter((p) => p && !p.startsWith('node_modules/') && !p.includes('node_modules\\'));
}

function commitExact(cwd, paths, message) {
  const filtered = paths.filter((p) => {
    const lower = p.toLowerCase();
    return (
      !lower.includes('node_modules') &&
      !lower.includes('/release/') &&
      !lower.includes('\\release\\') &&
      !lower.endsWith('.log')
    );
  });
  if (!filtered.length) return { ok: false, reason: 'NO_PATHS' };
  for (const p of filtered) {
    const add = runCmd(`git add -- "${p.replace(/"/g, '')}"`, { cwd });
    if (!add.ok) return { ok: false, reason: 'GIT_ADD_FAIL', path: p, stderr: add.stderr };
  }
  const msgFile = path.join(cwd, '.uaos-commit-msg.txt');
  fs.writeFileSync(msgFile, `${message}\n`, 'utf8');
  const commit = runCmd(
    `git -c user.email=uaos-factory@local -c user.name="UAOS Factory" commit -F "${msgFile}"`,
    { cwd }
  );
  try {
    fs.unlinkSync(msgFile);
  } catch {
    /* ignore */
  }
  const head = runCmd('git rev-parse HEAD', { cwd });
  return { ok: commit.ok, exitCode: commit.exitCode, head: (head.stdout || '').trim(), stderr: commit.stderr };
}

/**
 * Integrate with ancestry checks. Never silently PASS on divergence.
 * @param {{ lane: string, taskBranch: string, taskBaseCommit?: string|null, integrationWorktree?: string|null, integrationBranch?: string|null, disposable?: boolean }} args
 */
export function integrateTaskBranch({
  lane,
  taskBranch,
  taskBaseCommit = null,
  integrationWorktree = null,
  integrationBranch = null,
  alreadyIntegrated = false,
  allowRecreate = true,
  disposable = false,
  taskWorktree = null
} = {}) {
  const cfg = loadFactoryConfig();
  let integration = integrationWorktree || path.join(cfg.worktreeRoot, `${lane}-integration`);
  const branch = integrationBranch || cfg.lanes[lane].integrationBranch;
  const repoRoot = cfg.lanes[lane]?.repoRoot;

  let plan = planIntegration({
    cwd: integration,
    integrationBranch: branch,
    taskBranch,
    taskBaseCommit: taskBaseCommit || (fs.existsSync(integration) ? revParse(integration, 'HEAD') : null),
    alreadyIntegrated
  });

  // Never silently PASS when the integration worktree is missing.
  if (plan.action === 'INTEGRATION_WT_MISSING') {
    let recovery = null;
    // Only attempt recreate for real lane worktrees (never invent disposable roots).
    if (allowRecreate && !disposable && repoRoot) {
      recovery = tryRecreateIntegrationWorktree({
        repoRoot,
        integrationWorktree: integration,
        integrationBranch: branch
      });
      if (recovery.ok) {
        plan = planIntegration({
          cwd: integration,
          integrationBranch: branch,
          taskBranch,
          taskBaseCommit: taskBaseCommit || revParse(integration, 'HEAD'),
          alreadyIntegrated
        });
      }
    }
    if (plan.action === 'INTEGRATION_WT_MISSING') {
      return {
        ok: false,
        reason: 'INTEGRATION_WT_MISSING',
        plan,
        integrationWorktree: integration,
        integrationBranch: branch,
        recovery,
        preserveTaskWorktree: true,
        preserveTaskBranch: true,
        preserveTaskCommit: true,
        integrationStatus: 'NOT_INTEGRATED',
        remediation: recovery?.remediation ||
          `Recreate integration worktree at ${integration} for branch ${branch} only if repo/branch exist and no conflicting worktree owns the branch`
      };
    }
  }

  // The base moved out from under this task. Rather than giving up immediately (which — since
  // taskBaseCommit is otherwise never refreshed — would fail identically on every future retry,
  // per the documented systemic race), attempt one safe, git-verified rebase onto the new head
  // in the task's own worktree. Only a zero-conflict rebase counts as safe; any conflict aborts
  // cleanly and falls through to the unchanged rejection below. Disposable/synthetic runs never
  // attempt this — they use disposable throwaway repos with their own simpler contract.
  let rebaseAttempt = null;
  if (plan.action === 'INTEGRATION_HEAD_ADVANCED' && taskWorktree && !disposable) {
    rebaseAttempt = attemptSafeRebase(taskWorktree, {
      taskBranch,
      newBase: plan.integrationHead
    });
    if (rebaseAttempt.ok) {
      plan = planIntegration({
        cwd: integration,
        integrationBranch: branch,
        taskBranch,
        taskBaseCommit: rebaseAttempt.taskBaseCommit,
        alreadyIntegrated
      });
    }
  }

  if (plan.action === 'INTEGRATION_HEAD_ADVANCED' || plan.action === 'DIVERGED') {
    return {
      ok: false,
      reason: plan.reason || plan.action,
      plan,
      rebaseAttempt,
      preserveTaskWorktree: true,
      integrationStatus: 'NOT_INTEGRATED',
      note: rebaseAttempt && !rebaseAttempt.ok
        ? 'Safe rebase was attempted and conflicted; task worktree and commits preserved untouched — needs manual resolution, not a blind retry'
        : 'Task worktree preserved; rebase/replay required before integrate — never reset owner branches'
    };
  }

  const executed = executeIntegrationPlan(integration, plan, {
    integrationBranch: branch,
    taskBranch
  });
  return {
    ...executed,
    plan,
    rebaseAttempt,
    integrationWorktree: integration,
    integrationBranch: branch,
    integrationStatus: executed.ok ? 'INTEGRATED' : 'NOT_INTEGRATED'
  };
}

/** @deprecated use integrateTaskBranch — kept for callers expecting old shape */
function integrateFastForward(lane, taskBranch, extra = {}) {
  return integrateTaskBranch({
    lane,
    taskBranch,
    taskBaseCommit: extra.taskBaseCommit || null,
    integrationWorktree: extra.integrationWorktree || null,
    integrationBranch: extra.integrationBranch || null
  });
}

function markDependentsReady(lane, completedId) {
  const q = loadQueue(lane);
  const completed = q.tasks.find((x) => x.id === completedId);
  // Dependents advance only after proven durable integration — never from passed-only.
  if (!isDurablyIntegrated(completed)) return;
  for (const t of q.tasks) {
    if (!['pending', 'ready'].includes(t.status)) continue;
    const deps = t.dependsOn || [];
    if (!deps.includes(completedId)) continue;
    const allMet = deps.every((d) => {
      const dep = q.tasks.find((x) => x.id === d);
      return isDurablyIntegrated(dep);
    });
    if (allMet && t.status === 'pending') {
      t.status = 'ready';
      t.result = { ...(t.result || {}), advancedBy: completedId, at: nowIso() };
    }
  }
  saveQueue(lane, q);
}

/** noop-pass is allowed only for synthetic/test tasks or explicit allowNoOpPass. */
export function isNoopPassAllowed(task) {
  if (!task || task.localSyntheticAction !== 'noop-pass') return false;
  if (task.allowNoOpPass === true) return true;
  if (task.synthetic === true || task.testOnly === true) return true;
  if (isSyntheticTaskId(task.id)) {
    return true;
  }
  return false;
}

/**
 * Deterministic local writer used when headless CLI unavailable OR for factory self-tests.
 * Implements only when task.localSyntheticAction is set; otherwise writes FAIL result asking for headless writer.
 */
function runDeterministicLocalWriter(task, { worktree, artifactDir, evidenceDir, prompt }) {
  fs.writeFileSync(path.join(evidenceDir, 'PROMPT.md'), prompt, 'utf8');
  if (task.localSyntheticAction === 'create_marker_file') {
    const rel = task.localSyntheticPath || 'UAOS_GENERIC_MARKER.txt';
    const full = path.join(worktree, rel);
    ensureDir(path.dirname(full));
    fs.writeFileSync(full, `PASS ${task.id} ${nowIso()}\n`, 'utf8');
    const result = {
      ok: true,
      status: 'PASS',
      task: task.id,
      filesChanged: [rel],
      sourceChanges: 1,
      noOp: false,
      commitCreated: false,
      mode: 'synthetic_local',
      completedAt: nowIso()
    };
    atomicWriteJson(path.join(artifactDir, `${task.id}-result.json`), result);
    atomicWriteJson(path.join(evidenceDir, `${task.id}-result.json`), result);
    return result;
  }

  if (task.localSyntheticAction === 'noop-pass') {
    if (!isNoopPassAllowed(task)) {
      const denied = {
        ok: false,
        status: 'FAIL',
        task: task.id,
        mode: 'synthetic_local',
        reason: 'NOOP_PASS_NOT_ALLOWED',
        noOp: true,
        sourceChanges: 0,
        commitCreated: false,
        completedAt: nowIso()
      };
      atomicWriteJson(path.join(artifactDir, `${task.id}-result.json`), denied);
      atomicWriteJson(path.join(evidenceDir, `${task.id}-result.json`), denied);
      return denied;
    }
    const result = {
      ok: true,
      status: 'PASS',
      task: task.id,
      filesChanged: [],
      sourceChanges: 0,
      noOp: true,
      commitCreated: false,
      mode: 'synthetic_local_noop',
      completedAt: nowIso()
    };
    atomicWriteJson(path.join(artifactDir, `${task.id}-result.json`), result);
    atomicWriteJson(path.join(evidenceDir, `${task.id}-result.json`), result);
    return result;
  }

  if (task.localSyntheticAction) {
    const unknown = {
      ok: false,
      status: 'FAIL',
      task: task.id,
      mode: 'synthetic_local',
      reason: 'WRITER_FAIL',
      note: `Unsupported localSyntheticAction: ${task.localSyntheticAction}`,
      completedAt: nowIso()
    };
    atomicWriteJson(path.join(artifactDir, `${task.id}-result.json`), unknown);
    atomicWriteJson(path.join(evidenceDir, `${task.id}-result.json`), unknown);
    return unknown;
  }

  // Product tasks: attempt to run existing tests if already implemented; else FAIL with honest blocker
  const result = {
    ok: false,
    status: 'FAIL',
    task: task.id,
    mode: 'cursor_local_no_durable_writer',
    reason: 'BACKGROUND_CODE_WRITING_BLOCKED_AUTH_OR_CLI',
    note: 'No headless writer available; interactive Cursor must implement this task or Codex must pass smoke.',
    completedAt: nowIso()
  };
  atomicWriteJson(path.join(artifactDir, `${task.id}-result.json`), result);
  atomicWriteJson(path.join(evidenceDir, `${task.id}-result.json`), result);
  return result;
}

export function isTaskEligible(task, { lanePaused = false } = {}) {
  if (!task) return { ok: false, reason: 'NO_TASK' };
  if (lanePaused) return { ok: false, reason: 'LANE_PAUSED' };
  if (task.humanGate) return { ok: false, reason: 'HUMAN_GATE' };
  if (!['ready', 'retry', 'pending'].includes(task.status)) return { ok: false, reason: 'BAD_STATUS' };
  const retries = task.result?.retryCount || 0;
  if (retries > (task.retryLimit ?? 2)) return { ok: false, reason: 'RETRY_LIMIT' };
  return { ok: true };
}

export async function executeGenericTask(task, opts = {}) {
  const lane = task.lane;
  const cfg = loadFactoryConfig();
  const evidenceDir =
    opts.evidenceDir ||
    path.join(FACTORY_ROOT, 'logs', lane, task.id, nowIso().replace(/[:.]/g, '-'));
  const artifactDir =
    opts.artifactDir ||
    path.join(
      cfg.artifactRoot,
      lane === 'library' ? 'library' : lane,
      task.id
    );
  ensureDir(evidenceDir);
  ensureDir(artifactDir);
  ensureDir(path.join(FACTORY_ROOT, 'state', 'tmp'));

  const eligibility = isTaskEligible(task, { lanePaused: opts.lanePaused });
  if (!eligibility.ok) {
    return { ok: false, ...eligibility };
  }

  const isSynthetic =
    opts.forceAgent === 'synthetic-local' ||
    Boolean(task.localSyntheticAction) ||
    Boolean(opts.disposableSynthetic);

  let disposable = null;
  let worktree;
  let integrationWorktree = null;
  let integrationBranch = null;
  let taskBranch = `factory/${lane}-${String(task.id).toLowerCase()}`;
  let taskBaseCommit = task.taskBaseCommit || task.result?.taskBaseCommit || null;

  if (isSynthetic && !opts.useRealProductWorktree) {
    // Disposable D: repos — never mutate real library/singy/arranger integration history.
    disposable = createDisposableSyntheticRepos({ taskId: task.id });
    worktree = disposable.taskWorktree;
    integrationWorktree = disposable.integrationWorktree;
    integrationBranch = disposable.integrationBranch;
    taskBranch = disposable.taskBranch;
    taskBaseCommit = disposable.taskBaseCommit;
  } else {
    const wt = createTaskWorktree(lane, task.id);
    worktree = wt.worktreePath || cfg.lanes[lane].repoRoot;
    if (!taskBaseCommit) {
      taskBaseCommit = revParse(worktree, 'HEAD');
    }
  }

  updateTask(
    lane,
    task.id,
    recordTaskBaseCommit(
      {
        status: 'running',
        taskBranch,
        worktreePath: worktree,
        result: {
          phase: 'scout',
          taskBaseCommit,
          disposableSynthetic: Boolean(disposable),
          at: nowIso()
        }
      },
      taskBaseCommit
    )
  );

  const lockPath = path.join(worktree, '.uaos-task.lock');
  if (fs.existsSync(lockPath)) {
    const lock = readJson(lockPath, {});
    if (lock.pid && isPidAlive(lock.pid)) {
      return { ok: false, reason: 'WORKTREE_LOCKED', lock };
    }
    fs.renameSync(lockPath, `${lockPath}.stale.${Date.now()}`);
  }
  atomicWriteJson(lockPath, { pid: process.pid, taskId: task.id, startedAt: nowIso() });

  const scout = {
    role: 'SCOUT',
    taskId: task.id,
    at: nowIso(),
    rootCause: task.result?.firstBlocker || task.result?.reason || 'queue_objective',
    allowedPaths: task.allowedPaths || [],
    testCommands: task.commands?.tests || []
  };
  atomicWriteJson(path.join(evidenceDir, 'scout.json'), scout);

  const { prompt } = writePromptFiles(evidenceDir, task, {
    scout,
    reviewFeedback: task.result?.reviewFeedback || null,
    worktreePath: worktree
  });

  let writerAgent = opts.forceAgent || preferredWriterForLane(lane);
  if (opts.forceAgent === 'synthetic-local') writerAgent = 'synthetic-local';
  if (opts.forceAgent === 'verify-integrate') writerAgent = 'verify-integrate';

  let writerResult;
  const writerLog = path.join(evidenceDir, `writer-${writerAgent}.log`);

  if (writerAgent === 'verify-integrate') {
    const changed = listChangedFiles(worktree);
    writerResult = {
      ok: true,
      status: 'PASS',
      mode: 'verify-integrate',
      note: 'Integrator already applied changes; generic runner verifies/tests/commits',
      filesChanged: changed,
      completedAt: nowIso()
    };
    atomicWriteJson(path.join(evidenceDir, `${task.id}-writer.json`), writerResult);
  } else if (writerAgent === 'synthetic-local' || task.localSyntheticAction) {
    writerResult = runDeterministicLocalWriter(task, {
      worktree,
      artifactDir,
      evidenceDir,
      prompt
    });
  } else if (writerAgent === 'codex' && isWriterAvailable('codex')) {
    // Spawn sync for pipeline control (supervisor already detached this process)
    const promptFile = path.join(evidenceDir, 'PROMPT.md');
    const cmd = `codex exec --skip-git-repo-check -C "${worktree}" -c model="gpt-4.1" -s workspace-write --dangerously-bypass-approvals-and-sandbox "$(Get-Content -Raw '${promptFile}')"`;
    // Prefer stdin prompt for Windows quoting safety
    const r = spawnSync('codex', [
      'exec',
      '--skip-git-repo-check',
      '-C',
      worktree,
      '-c',
      'model="gpt-4.1"',
      '-s',
      'workspace-write',
      '-'
    ], {
      cwd: worktree,
      input: prompt,
      encoding: 'utf8',
      timeout: (task.timeoutMinutes || 90) * 60 * 1000,
      env: {
        ...process.env,
        TEMP: path.join(FACTORY_ROOT, 'state', 'tmp'),
        TMP: path.join(FACTORY_ROOT, 'state', 'tmp')
      },
      windowsHide: true
    });
    fs.writeFileSync(writerLog, `${r.stdout || ''}\n${r.stderr || ''}\nEXIT=${r.status}\n`, 'utf8');
    writerResult = {
      ok: (r.status ?? 1) === 0,
      status: (r.status ?? 1) === 0 ? 'PASS' : 'FAIL',
      exitCode: r.status,
      mode: 'codex',
      logFile: writerLog
    };
    atomicWriteJson(path.join(evidenceDir, `${task.id}-writer.json`), writerResult);
  } else {
    writerResult = runDeterministicLocalWriter(task, {
      worktree,
      artifactDir,
      evidenceDir,
      prompt
    });
  }

  // TESTING
  updateTask(lane, task.id, {
    status: 'testing',
    result: { phase: 'testing', writer: writerAgent, at: nowIso() }
  });

  const testCmds = [
    ...(task.commands?.preflight || []),
    ...(task.commands?.tests || []),
    ...(task.commands?.acceptance || [])
  ].filter(Boolean);

  const testResults = [];
  for (const cmd of testCmds) {
    const tr = runTimed(cmd, { cwd: worktree, timeoutMs: 300000 });
    testResults.push(tr);
    atomicWriteJson(path.join(evidenceDir, `test-${testResults.length}.json`), tr);
    if (!tr.ok) break;
  }

  const testsOk = testCmds.length === 0 ? writerResult.ok !== false : testResults.every((t) => t.ok);

  // REVIEW
  updateTask(lane, task.id, { status: 'reviewing', result: { phase: 'reviewing', at: nowIso() } });
  const diff = runCmd('git diff --stat HEAD', { cwd: worktree });
  const review = reviewDiffSummary({
    task,
    diffText: diff.stdout || '',
    testResults
  });
  atomicWriteJson(path.join(evidenceDir, 'review.json'), review);

  let finalStatus = 'FAIL';
  let commitInfo = null;
  let integrateInfo = null;

  if (testsOk && review.verdict === 'APPROVE' && (writerResult.ok || writerResult.status === 'PASS')) {
    const changed = listChangedFiles(worktree);
    if (changed.length) {
      commitInfo = commitExact(worktree, changed, `${task.id}: ${task.title}`);
    } else if (task.localSyntheticAction === 'noop-pass' && writerResult.noOp) {
      const head = revParse(worktree, 'HEAD');
      commitInfo = {
        ok: true,
        reason: 'NOOP_NO_COMMIT',
        head,
        commitCreated: false,
        noOp: true,
        sourceChanges: 0
      };
    } else if (task.localSyntheticAction && task.localSyntheticAction !== 'noop-pass') {
      commitInfo = commitExact(
        worktree,
        [task.localSyntheticPath || 'UAOS_GENERIC_MARKER.txt'],
        `${task.id}: ${task.title}`
      );
    } else {
      commitInfo = {
        ok: true,
        reason: 'NO_DIFF_ALREADY_COMMITTED',
        head: runCmd('git rev-parse HEAD', { cwd: worktree }).stdout?.trim(),
        commitCreated: false
      };
    }

    if (commitInfo.ok) {
      integrateInfo = integrateTaskBranch({
        lane,
        taskBranch,
        taskBaseCommit,
        integrationWorktree,
        integrationBranch,
        alreadyIntegrated: Boolean(writerResult.noOp && task.allowNoOpIntegrateUnchanged),
        disposable: Boolean(disposable),
        allowRecreate: !disposable,
        taskWorktree: worktree
      });

      // INTEGRATION_WT_MISSING and any other integrate failure must NEVER mark PASS/integrated.
      if (integrateInfo.ok) {
        finalStatus = 'PASS';
        const persisted = transitionTask(lane, task.id, {
          status: 'integrated',
          integrationStatus: 'INTEGRATED',
          blockingReason: null,
          nextAutomaticRetry: null,
          result: {
            status: 'PASS',
            writer: writerAgent,
            commit: commitInfo.head,
            commitCreated: commitInfo.commitCreated !== false && Boolean(commitInfo.head) && commitInfo.reason !== 'NOOP_NO_COMMIT',
            noOp: Boolean(writerResult.noOp),
            sourceChanges: writerResult.sourceChanges ?? (changed.length || 0),
            taskBaseCommit,
            disposableSynthetic: Boolean(disposable),
            tests: testResults,
            review,
            integrate: integrateInfo,
            integrationCommit: integrateInfo.integrationHead || integrateInfo.plan?.integrationHead || null,
            evidenceDir,
            artifactDir,
            at: nowIso()
          }
        });
        if (!persisted.ok) {
          finalStatus = 'FAIL';
          transitionTask(lane, task.id, {
            status: 'blocked',
            blockingReason: 'STATE_PERSISTENCE_FAILED',
            integrationStatus: 'NOT_INTEGRATED',
            nextAutomaticRetry: null,
            result: {
              reason: 'STATE_PERSISTENCE_FAILED',
              integrate: integrateInfo,
              commit: commitInfo,
              at: nowIso()
            }
          });
        } else {
          markDependentsReady(lane, task.id);
        }
      } else {
        finalStatus = 'FAIL';
        transitionTask(lane, task.id, {
          status: 'blocked',
          blockingReason: integrateInfo.reason || 'INTEGRATE_CONFLICT',
          integrationStatus: 'NOT_INTEGRATED',
          nextAutomaticRetry: null,
          result: {
            reason: integrateInfo.reason || 'INTEGRATE_CONFLICT',
            integrate: integrateInfo,
            commit: commitInfo,
            taskBaseCommit,
            taskBranch,
            worktreePath: worktree,
            preserveTaskWorktree: true,
            preserveTaskBranch: true,
            missingIntegrationPath: integrateInfo.integrationWorktree || integrationWorktree,
            remediation: integrateInfo.remediation || null,
            at: nowIso()
          }
        });
      }
    } else {
      const retries = (task.result?.retryCount || 0) + 1;
      updateTask(lane, task.id, {
        status: retries > (task.retryLimit ?? 2) ? 'blocked' : 'retry',
        integrationStatus: 'NOT_INTEGRATED',
        result: {
          reason: 'COMMIT_FAIL',
          retryCount: retries,
          commit: commitInfo,
          reviewFeedback: review,
          at: nowIso()
        }
      });
    }
  } else {
    const retries = (task.result?.retryCount || 0) + 1;
    const blocked = retries > (task.retryLimit ?? 2);
    updateTask(lane, task.id, {
      status: blocked ? 'blocked' : 'retry',
      result: {
        reason: blocked ? 'RETRY_LIMIT' : 'TESTS_OR_REVIEW_FAIL',
        retryCount: retries,
        tests: testResults,
        review,
        writer: writerResult,
        reviewFeedback: review,
        at: nowIso()
      }
    });
  }

  const summary = {
    ok: finalStatus === 'PASS',
    status: finalStatus,
    task: task.id,
    lane,
    writerAgent,
    tests: testResults,
    review,
    commit: commitInfo,
    integrate: integrateInfo,
    evidenceDir,
    artifactDir,
    completedAt: nowIso()
  };
  atomicWriteJson(path.join(artifactDir, `${task.id}-result.json`), summary);
  atomicWriteJson(path.join(evidenceDir, `${task.id}-result.json`), summary);

  try {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  } catch {
    /* ignore */
  }

  return summary;
}

// CLI entry
if (process.argv[1] && path.resolve(process.argv[1]).endsWith('generic-runner.mjs')) {
  const args = parseArgs(process.argv);
  const lane = args.lane;
  const taskId = args.task;
  const q = loadQueue(lane);
  const task = q.tasks.find((t) => t.id === taskId);
  if (!task) {
    console.error(JSON.stringify({ ok: false, error: 'TASK_NOT_FOUND', lane, taskId }));
    process.exit(2);
  }
  // merge CLI overrides onto task
  if (args.artifact) task._artifactOverride = args.artifact;
  executeGenericTask(
    {
      ...task,
      localSyntheticAction: args['synthetic-action'] || task.localSyntheticAction,
      localSyntheticPath: args['synthetic-path'] || task.localSyntheticPath
    },
    {
      artifactDir: args.artifact,
      evidenceDir: args.evidence,
      forceAgent: args['force-agent']
    }
  )
    .then((r) => {
      console.log(JSON.stringify({ status: r.status, task: r.task, ok: r.ok }));
      process.exit(r.ok ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
