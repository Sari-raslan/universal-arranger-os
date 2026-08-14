import fs from 'node:fs';
import path from 'node:path';
import {
  FACTORY_ROOT,
  atomicWriteJson,
  readJson,
  nowIso,
  loadFactoryConfig,
  ensureDir,
  spawnDetached,
  isPidAlive,
  freeRamGb,
  freeDiskGb
} from './lib.mjs';
import { evaluateResources } from './resource-guard.mjs';
import {
  discoverLane,
  writeMasterDiscoverySummary,
  recoverSingyS001,
  recoverArrangerA001,
  recoverLibraryL001
} from './recovery.mjs';
import { writeMasterStatus } from './reporter.mjs';
import { createIntegrationWorktree } from './worktree-manager.mjs';
import { availableAgents, unavailableAgents } from './agent-adapters.mjs';
import { runSupervisorLoop } from './supervisor.mjs';
import { interruptRunningTasks } from './queue-manager.mjs';

const cmd = process.argv[2] || 'status';

function writePreflight() {
  const ts = new Date();
  const stamp = ts.toISOString().replace(/[:.]/g, '-');
  const ram = freeRamGb();
  const disks = { C: freeDiskGb('C'), D: freeDiskGb('D'), E: freeDiskGb('E') };
  const resources = evaluateResources();
  const payload = {
    timestamp: ts.toISOString(),
    os: process.platform,
    node: process.version,
    ram,
    disks,
    resources,
    agentsAvailable: availableAgents().map((a) => a.id),
    agentsUnavailable: unavailableAgents().map((a) => a.id),
    gitIndexLock: fs.existsSync(path.join(path.dirname(FACTORY_ROOT), '.git', 'index.lock')),
    factoryExists: true,
    pass:
      disks.C >= 10 &&
      ram.freeGb >= 4 &&
      !resources.pauseFactory
  };
  const base = path.join(FACTORY_ROOT, 'reports', `POST_RESTART_PREFLIGHT_${stamp}`);
  atomicWriteJson(`${base}.json`, payload);
  fs.writeFileSync(
    `${base}.md`,
    [
      '# POST RESTART PREFLIGHT',
      '',
      `timestamp: ${payload.timestamp}`,
      `PASS: ${payload.pass}`,
      `RAM free: ${ram.freeGb} GB / ${ram.totalGb} GB`,
      `Disk C/D/E: ${disks.C}/${disks.D}/${disks.E} GB`,
      `Agents available: ${payload.agentsAvailable.join(', ')}`,
      `Agents unavailable: ${payload.agentsUnavailable.join(', ') || 'none'}`,
      `Concurrency: heavy=${resources.limits.maxHeavyWriters} light=${resources.limits.maxLightReviewers}`,
      ''
    ].join('\n'),
    'utf8'
  );
  return payload;
}

function initQueuesAlreadyPresent() {
  // queues written as static files; ensure state files exist
  ensureDir(path.join(FACTORY_ROOT, 'state'));
  for (const lane of ['singy', 'arranger', 'library']) {
    const p = path.join(FACTORY_ROOT, 'state', `${lane}-state.json`);
    if (!fs.existsSync(p)) {
      atomicWriteJson(p, { lane, status: 'initialized', updatedAt: nowIso() });
    }
  }
  if (!fs.existsSync(path.join(FACTORY_ROOT, 'state', 'factory-state.json'))) {
    atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'factory-state.json'), {
      status: 'initialized',
      updatedAt: nowIso()
    });
  }
}

async function main() {
  switch (cmd) {
    case 'doctor': {
      const pre = writePreflight();
      console.log(JSON.stringify({ doctor: pre.pass ? 'PASS' : 'WARN', pre }, null, 2));
      process.exit(pre.pass ? 0 : 2);
      break;
    }
    case 'discover': {
      const discoveries = ['singy', 'arranger', 'library'].map((l) => discoverLane(l));
      const summary = writeMasterDiscoverySummary(discoveries);
      const wts = {};
      for (const lane of ['singy', 'arranger', 'library']) {
        wts[lane] = createIntegrationWorktree(lane);
      }
      console.log(JSON.stringify({ summary, wts }, null, 2));
      break;
    }
    case 'init': {
      initQueuesAlreadyPresent();
      writePreflight();
      const discoveries = ['singy', 'arranger', 'library'].map((l) => discoverLane(l));
      writeMasterDiscoverySummary(discoveries);
      for (const lane of ['singy', 'arranger', 'library']) {
        createIntegrationWorktree(lane);
        interruptRunningTasks(lane);
      }
      writeMasterStatus();
      console.log(JSON.stringify({ init: 'ok', agents: availableAgents().map((a) => a.id) }, null, 2));
      break;
    }
    case 'recover': {
      const s = recoverSingyS001();
      const a = recoverArrangerA001();
      const l = recoverLibraryL001();
      writeMasterStatus();
      console.log(JSON.stringify({ S001: s.firstBlocker, A001: a.firstBlocker, L001: l.firstBlocker }, null, 2));
      break;
    }
    case 'start': {
      initQueuesAlreadyPresent();
      const stopPath = path.join(FACTORY_ROOT, 'state', 'STOP');
      if (fs.existsSync(stopPath)) fs.unlinkSync(stopPath);
      const pausePath = path.join(FACTORY_ROOT, 'state', 'PAUSE');
      if (fs.existsSync(pausePath)) fs.unlinkSync(pausePath);

      // Start dashboard
      const dashLog = path.join(FACTORY_ROOT, 'logs', 'dashboard.log');
      const dashPid = path.join(FACTORY_ROOT, 'state', 'dashboard.pid.json');
      const existingDash = readJson(dashPid, null);
      if (!(existingDash?.pid && isPidAlive(existingDash.pid))) {
        spawnDetached(process.execPath, [path.join(FACTORY_ROOT, 'dashboard', 'server.mjs')], {
          cwd: FACTORY_ROOT,
          logFile: dashLog,
          pidFile: dashPid
        });
      }

      // Start supervisor detached
      const supLog = path.join(FACTORY_ROOT, 'logs', 'supervisor.log');
      const supPid = path.join(FACTORY_ROOT, 'state', 'supervisor.pid.json');
      const existingSup = readJson(supPid, null);
      if (existingSup?.pid && isPidAlive(existingSup.pid)) {
        console.log(JSON.stringify({ start: 'already_running', pid: existingSup.pid }, null, 2));
      } else {
        const pid = spawnDetached(process.execPath, [path.join(FACTORY_ROOT, 'src', 'run-supervisor.mjs')], {
          cwd: FACTORY_ROOT,
          logFile: supLog,
          pidFile: supPid
        });
        console.log(JSON.stringify({ start: 'ok', supervisorPid: pid, dashboard: 'http://127.0.0.1:17321' }, null, 2));
      }
      writeMasterStatus();
      break;
    }
    case 'stop': {
      atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'STOP'), { at: nowIso() });
      const { terminateOwnedWriters, countOwnedAliveWriters, loadActiveWriters } = await import('./dispatch.mjs');
      const killedWriters = terminateOwnedWriters();
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        /* wait for owned children */
      }
      const sup = readJson(path.join(FACTORY_ROOT, 'state', 'supervisor.pid.json'), null);
      const dash = readJson(path.join(FACTORY_ROOT, 'state', 'dashboard.pid.json'), null);
      for (const p of [sup, dash]) {
        if (p?.pid && isPidAlive(p.pid)) {
          try {
            process.kill(p.pid);
          } catch {
            /* ignore */
          }
        }
      }
      const orphanOwned = countOwnedAliveWriters();
      try {
        if (fs.existsSync(path.join(FACTORY_ROOT, 'state', 'supervisor.lock'))) {
          fs.unlinkSync(path.join(FACTORY_ROOT, 'state', 'supervisor.lock'));
        }
      } catch {
        /* ignore */
      }
      atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'factory-state.json'), {
        status: 'stopped',
        stoppedAt: nowIso(),
        safeStop: {
          killedWriters,
          orphanOwnedWriters: orphanOwned,
          activeWritersAfter: loadActiveWriters()
        }
      });
      writeMasterStatus();
      console.log(
        JSON.stringify(
          { stop: 'requested', killedWriters, orphanOwnedWriters: orphanOwned },
          null,
          2
        )
      );
      break;
    }
    case 'resume-task': {
      const lane = process.argv[3];
      const taskId = process.argv[4];
      if (!lane || !taskId) {
        console.error('Usage: node src/cli.mjs resume-task <lane> <taskId>');
        process.exit(1);
      }
      const { buildResumePatch } = await import('./retry-policy.mjs');
      const { updateTask, getTask } = await import('./queue-manager.mjs');
      const task = getTask(lane, taskId);
      if (!task) {
        console.error(`Task not found: ${lane}/${taskId}`);
        process.exit(1);
      }
      const updated = updateTask(lane, taskId, buildResumePatch(task));
      writeMasterStatus();
      console.log(JSON.stringify({ resumeTask: 'ok', task: { id: updated.id, status: updated.status } }, null, 2));
      break;
    }
    case 'claim-task': {
      const lane = process.argv[3];
      const taskId = process.argv[4];
      if (!lane || !taskId) {
        console.error('Usage: node src/cli.mjs claim-task <lane> <taskId>');
        process.exit(1);
      }
      const { claimTaskCursorLocal } = await import('./cursor-local-claim.mjs');
      const res = claimTaskCursorLocal(lane, taskId);
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.ok ? 0 : 2);
      break;
    }
    case 'pause': {
      atomicWriteJson(path.join(FACTORY_ROOT, 'state', 'PAUSE'), { at: nowIso() });
      console.log(JSON.stringify({ pause: 'ok' }, null, 2));
      break;
    }
    case 'resume': {
      const pausePath = path.join(FACTORY_ROOT, 'state', 'PAUSE');
      if (fs.existsSync(pausePath)) fs.unlinkSync(pausePath);
      console.log(JSON.stringify({ resume: 'ok' }, null, 2));
      break;
    }
    case 'status': {
      const status = writeMasterStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
    }
    case 'supervise-once': {
      await runSupervisorLoop({ once: true });
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
