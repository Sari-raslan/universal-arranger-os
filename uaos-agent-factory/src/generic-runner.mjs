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
  readJson
} from './lib.mjs';
import { writePromptFiles } from './task-prompt.mjs';
import { createTaskWorktree } from './worktree-manager.mjs';
import { assertSafeCommands } from './security-guard.mjs';
import { reviewDiffSummary } from './review-runner.mjs';
import { updateTask, loadQueue, saveQueue } from './queue-manager.mjs';
import {
  preferredWriterForLane,
  isWriterAvailable,
  spawnWriterProcess
} from './writer-adapters.mjs';

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
      TEMP: 'D:\\UAOS_AGENT_FACTORY_BUILD\\tmp',
      TMP: 'D:\\UAOS_AGENT_FACTORY_BUILD\\tmp'
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
  const commit = runCmd(`git commit -F "${msgFile}"`, { cwd });
  try {
    fs.unlinkSync(msgFile);
  } catch {
    /* ignore */
  }
  const head = runCmd('git rev-parse HEAD', { cwd });
  return { ok: commit.ok, exitCode: commit.exitCode, head: (head.stdout || '').trim(), stderr: commit.stderr };
}

function integrateFastForward(lane, taskBranch) {
  const cfg = loadFactoryConfig();
  const integration = path.join(cfg.worktreeRoot, `${lane}-integration`);
  const branch = cfg.lanes[lane].integrationBranch;
  if (!fs.existsSync(integration)) {
    return { ok: false, reason: 'INTEGRATION_WT_MISSING' };
  }
  const co = runCmd(`git checkout ${branch}`, { cwd: integration });
  if (!co.ok) return { ok: false, reason: 'CHECKOUT_FAIL', stderr: co.stderr };
  const merge = runCmd(`git merge --ff-only ${taskBranch}`, { cwd: integration });
  return { ok: merge.ok, stderr: merge.stderr, stdout: merge.stdout };
}

function markDependentsReady(lane, completedId) {
  const q = loadQueue(lane);
  for (const t of q.tasks) {
    if (!['pending', 'ready'].includes(t.status)) continue;
    const deps = t.dependsOn || [];
    if (!deps.includes(completedId)) continue;
    const allMet = deps.every((d) => {
      const dep = q.tasks.find((x) => x.id === d);
      return dep && ['passed', 'integrated'].includes(dep.status);
    });
    if (allMet && t.status === 'pending') {
      t.status = 'ready';
      t.result = { ...(t.result || {}), advancedBy: completedId, at: nowIso() };
    }
  }
  saveQueue(lane, q);
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
      mode: 'synthetic_local',
      completedAt: nowIso()
    };
    atomicWriteJson(path.join(artifactDir, `${task.id}-result.json`), result);
    atomicWriteJson(path.join(evidenceDir, `${task.id}-result.json`), result);
    return result;
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
  ensureDir('D:\\UAOS_AGENT_FACTORY_BUILD\\tmp');

  const eligibility = isTaskEligible(task, { lanePaused: opts.lanePaused });
  if (!eligibility.ok) {
    return { ok: false, ...eligibility };
  }

  updateTask(lane, task.id, { status: 'running', result: { phase: 'scout', at: nowIso() } });

  const wt = createTaskWorktree(lane, task.id);
  const worktree = wt.worktreePath || cfg.lanes[lane].repoRoot;
  const lockPath = path.join(worktree, '.uaos-task.lock');
  if (fs.existsSync(lockPath)) {
    const lock = readJson(lockPath, {});
    if (lock.pid && runCmd(`powershell -NoProfile -Command "Get-Process -Id ${lock.pid}"`, { timeout: 10000 }).ok) {
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
        TEMP: 'D:\\UAOS_AGENT_FACTORY_BUILD\\tmp',
        TMP: 'D:\\UAOS_AGENT_FACTORY_BUILD\\tmp'
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
    } else if (task.localSyntheticAction) {
      commitInfo = commitExact(
        worktree,
        [task.localSyntheticPath || 'UAOS_GENERIC_MARKER.txt'],
        `${task.id}: ${task.title}`
      );
    } else {
      commitInfo = { ok: true, reason: 'NO_DIFF_ALREADY_COMMITTED', head: runCmd('git rev-parse HEAD', { cwd: worktree }).stdout?.trim() };
    }

    if (commitInfo.ok) {
      integrateInfo = integrateFastForward(lane, `factory/${lane}-${task.id.toLowerCase()}`);
      if (integrateInfo.ok || integrateInfo.reason === 'INTEGRATION_WT_MISSING') {
        finalStatus = 'PASS';
        updateTask(lane, task.id, {
          status: 'integrated',
          result: {
            status: 'PASS',
            writer: writerAgent,
            commit: commitInfo.head,
            tests: testResults,
            review,
            integrate: integrateInfo,
            evidenceDir,
            artifactDir,
            at: nowIso()
          }
        });
        markDependentsReady(lane, task.id);
      } else {
        updateTask(lane, task.id, {
          status: 'blocked',
          result: {
            reason: 'INTEGRATE_CONFLICT',
            integrate: integrateInfo,
            commit: commitInfo,
            at: nowIso()
          }
        });
      }
    } else {
      const retries = (task.result?.retryCount || 0) + 1;
      updateTask(lane, task.id, {
        status: retries > (task.retryLimit ?? 2) ? 'blocked' : 'retry',
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
