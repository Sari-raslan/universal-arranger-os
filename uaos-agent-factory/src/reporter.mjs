import path from 'node:path';
import fs from 'node:fs';
import {
  FACTORY_ROOT,
  atomicWriteJson,
  readJson,
  nowIso,
  loadFactoryConfig
} from './lib.mjs';
import { loadQueue } from './queue-manager.mjs';
import { evaluateResources } from './resource-guard.mjs';
import { getLaneRepositoryDiagnostics } from './lane-repositories.mjs';

export function writeMasterStatus() {
  const cfg = loadFactoryConfig();
  const lanes = ['singy', 'arranger', 'library'];
  const laneStatus = {};
  for (const lane of lanes) {
    const q = loadQueue(lane);
    const repoDiagnostics = getLaneRepositoryDiagnostics(lane);
    const current =
      q.tasks.find((t) =>
        ['running', 'scouting', 'testing', 'reviewing', 'waiting_human', 'interrupted'].includes(t.status)
      ) ||
      q.tasks.find((t) => ['pending', 'ready', 'retry'].includes(t.status)) ||
      null;
    const passed = q.tasks.filter((t) => ['passed', 'integrated'].includes(t.status)).length;
    const blocked = q.tasks.filter((t) => t.status === 'blocked' || t.status === 'waiting_human');
    laneStatus[lane] = {
      productName: cfg.lanes[lane].productName,
      repoRoot: repoDiagnostics.path,
      repoRepositoryStatus: repoDiagnostics.ok ? 'RESOLVED' : repoDiagnostics.reason,
      currentTask: current ? current.id : null,
      currentTitle: current ? current.title : null,
      currentStatus: current ? current.status : 'idle',
      executor: current?.executor || current?.result?.executor || null,
      writer: current?.writerRole || current?.result?.writer || null,
      writerPid: current?.writerPid ?? current?.result?.writerPid ?? null,
      executionMode: current?.executionMode || current?.result?.executionMode || null,
      taskWorktree: current?.worktreePath || current?.result?.taskWorktree || null,
      taskBranch: current?.taskBranch || current?.result?.taskBranch || null,
      claimId: current?.claimId || current?.result?.claimId || null,
      logFile: current?.result?.logFile || null,
      passed,
      total: q.tasks.length,
      blockers: blocked.map((t) => ({
        id: t.id,
        status: t.status,
        result: t.result?.firstBlocker || t.blockingReason || null
      }))
    };
  }

  const factoryState = readJson(path.join(FACTORY_ROOT, 'state', 'factory-state.json'), {});
  const resources = evaluateResources();
  const payload = {
    updatedAt: nowIso(),
    factoryStatus: factoryState.status || 'unknown',
    supervisorPid: factoryState.supervisorPid || null,
    dashboardUrl: `http://${cfg.dashboardHost}:${cfg.dashboardPort}`,
    resources,
    lanes: laneStatus
  };

  atomicWriteJson(path.join(FACTORY_ROOT, 'reports', 'MASTER_STATUS_LATEST.json'), payload);
  const md = [
    '# MASTER STATUS LATEST',
    '',
    `updatedAt: ${payload.updatedAt}`,
    `factoryStatus: ${payload.factoryStatus}`,
    `supervisorPid: ${payload.supervisorPid}`,
    `dashboard: ${payload.dashboardUrl}`,
    `RAM free: ${resources.ram.freeGb} GB`,
    '',
    ...lanes.map((l) => {
      const s = laneStatus[l];
      return [
        `## ${l}`,
        `- task: ${s.currentTask || '-'} (${s.currentStatus})`,
        `- executor: ${s.executor || '-'}`,
        `- writerPid: ${s.writerPid == null && s.executionMode === 'interactive_cursor_agent' ? 'n/a' : (s.writerPid ?? '-')}`,
        `- executionMode: ${s.executionMode || '-'}`,
        `- worktree: ${s.taskWorktree || '-'}`,
        `- branch: ${s.taskBranch || '-'}`,
        `- progress: ${s.passed}/${s.total}`,
        ''
      ].join('\n');
    })
  ].join('\n');
  fs.writeFileSync(path.join(FACTORY_ROOT, 'reports', 'MASTER_STATUS_LATEST.md'), md, 'utf8');
  return payload;
}
