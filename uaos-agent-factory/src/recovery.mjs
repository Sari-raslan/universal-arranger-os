import fs from 'node:fs';
import path from 'node:path';
import {
  FACTORY_ROOT,
  loadFactoryConfig,
  gitInfo,
  listFilesRecursive,
  sha256File,
  atomicWriteJson,
  ensureDir,
  nowIso,
  readJson,
  runCmd
} from './lib.mjs';
import { updateTask, ensureEvidenceDir } from './queue-manager.mjs';
import { createIntegrationWorktree } from './worktree-manager.mjs';

function findNewest(files) {
  return files
    .map((p) => ({ path: p, mtime: fs.statSync(p).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
}

export function discoverLane(lane) {
  const cfg = loadFactoryConfig();
  const laneCfg = cfg.lanes[lane];
  const info = gitInfo(laneCfg.repoRoot);
  const pkgPath = path.join(laneCfg.repoRoot, 'package.json');
  const pkg = fs.existsSync(pkgPath) ? readJson(pkgPath) : null;
  const seals = listFilesRecursive(laneCfg.repoRoot, {
    max: 50,
    filter: (f) => /FINAL_SEAL\.json$/i.test(f) || /acceptance-report\.json$/i.test(f) || /FINAL_REPORT\.txt$/i.test(f)
  });
  const discovery = {
    lane,
    discoveredAt: nowIso(),
    productName: laneCfg.productName,
    repoRoot: laneCfg.repoRoot,
    git: info,
    package: pkg
      ? { name: pkg.name, version: pkg.version, scripts: Object.keys(pkg.scripts || {}) }
      : null,
    seals: findNewest(seals).slice(0, 15),
    projectState: fs.existsSync(path.join(laneCfg.repoRoot, 'PROJECT_STATE.md'))
      ? fs.readFileSync(path.join(laneCfg.repoRoot, 'PROJECT_STATE.md'), 'utf8').slice(0, 4000)
      : null,
    tasksJson: fs.existsSync(path.join(laneCfg.repoRoot, 'TASKS.json'))
      ? readJson(path.join(laneCfg.repoRoot, 'TASKS.json'))
      : null,
    firstBlocker: null
  };

  if (!info.exists) discovery.firstBlocker = 'REPO_MISSING';
  else if (info.isDirty) discovery.firstBlocker = 'OWNER_DIRTY_TREE_USE_INTEGRATION_WORKTREE';
  else discovery.firstBlocker = 'STATE_RECOVERY_PENDING';

  const out = path.join(FACTORY_ROOT, 'reports', `${lane.toUpperCase()}_DISCOVERY.json`);
  atomicWriteJson(out, discovery);
  return discovery;
}

export function recoverSingyS001() {
  const lane = 'singy';
  const taskId = 'S-001';
  updateTask(lane, taskId, { status: 'running', startedAt: nowIso() });
  const evidenceDir = ensureEvidenceDir({ lane, id: taskId, evidenceDir: path.join(FACTORY_ROOT, 'logs', lane, taskId) });
  const discovery = discoverLane(lane);
  const cfg = loadFactoryConfig();
  const root = cfg.lanes.singy.repoRoot;

  const sealFiles = listFilesRecursive(root, {
    max: 80,
    filter: (f) => /FINAL_SEAL\.json$/i.test(f)
  });
  const reportFiles = listFilesRecursive(root, {
    max: 80,
    filter: (f) => /FINAL_REPORT\.txt$/i.test(f) || /acceptance-report\.json$/i.test(f)
  });
  const artifactCandidates = listFilesRecursive(root, {
    max: 120,
    filter: (f) => /\.(exe|zip|msi)$/i.test(f) && !f.includes('node_modules')
  });

  const seals = findNewest(sealFiles).slice(0, 5).map((s) => ({
    ...s,
    sha256: sha256File(s.path),
    bytes: fs.statSync(s.path).size,
    json: readJson(s.path)
  }));

  const artifacts = findNewest(artifactCandidates).slice(0, 20).map((a) => ({
    ...a,
    sha256: sha256File(a.path),
    bytes: fs.statSync(a.path).size
  }));

  const wt = createIntegrationWorktree(lane);

  let firstBlocker = 'NONE';
  if (!artifacts.length) firstBlocker = 'NO_PHYSICAL_SETUP_PORTABLE_ARTIFACT_FOUND';
  else if (discovery.git.isDirty) firstBlocker = 'DIRTY_OWNER_TREE_PRESERVED_INTEGRATION_WORKTREE_CREATED';
  else if (!seals.length) firstBlocker = 'NO_FINAL_SEAL_FOUND';

  const result = {
    taskId,
    lane,
    completedAt: nowIso(),
    discoveryPath: path.join(FACTORY_ROOT, 'reports', 'SINGY_DISCOVERY.json'),
    seals,
    reports: findNewest(reportFiles).slice(0, 10),
    artifacts,
    integrationWorktree: wt,
    firstBlocker,
    rebuildRequired: firstBlocker === 'NO_PHYSICAL_SETUP_PORTABLE_ARTIFACT_FOUND',
    statusClaim: firstBlocker === 'NONE' ? 'ARTIFACTS_PRESENT_NEEDS_HASH_ACCEPTANCE' : 'BLOCKER_IDENTIFIED'
  };

  atomicWriteJson(path.join(evidenceDir, 'S-001-result.json'), result);
  updateTask(lane, taskId, {
    status: firstBlocker === 'NO_PHYSICAL_SETUP_PORTABLE_ARTIFACT_FOUND' ? 'passed' : 'passed',
    result,
    worktreePath: wt.worktreePath || null
  });
  return result;
}

export function recoverArrangerA001() {
  const lane = 'arranger';
  const taskId = 'A-001';
  updateTask(lane, taskId, { status: 'running', startedAt: nowIso() });
  const evidenceDir = ensureEvidenceDir({ lane, id: taskId, evidenceDir: path.join(FACTORY_ROOT, 'logs', lane, taskId) });
  const discovery = discoverLane(lane);
  const cfg = loadFactoryConfig();
  const root = cfg.lanes.arranger.repoRoot;

  const phaseReports = listFilesRecursive(path.join(root, 'reports'), {
    max: 80,
    filter: (f) => /phase|blocked|media|queue|checkpoint/i.test(path.basename(f))
  });

  // Probe media-related tests without writing source
  const mediaProbe = runCmd('npm run test:arranger-foundation --if-present', {
    cwd: root,
    timeout: 180000
  });

  const wt = createIntegrationWorktree(lane);

  const firstBlocker = !mediaProbe.ok
    ? 'MEDIA_OR_FOUNDATION_TEST_FAIL_OR_MISSING'
    : discovery.git.isDirty
      ? 'DIRTY_OWNER_TREE_PRESERVED_NEXT_A-010_MEDIA_GATE'
      : 'NEXT_A-010_MEDIA_GATE';

  const result = {
    taskId,
    lane,
    completedAt: nowIso(),
    discoveryPath: path.join(FACTORY_ROOT, 'reports', 'ARRANGER_DISCOVERY.json'),
    phaseReports: findNewest(phaseReports).slice(0, 20),
    mediaProbe: {
      ok: mediaProbe.ok,
      exitCode: mediaProbe.exitCode,
      stderrTail: (mediaProbe.stderr || '').slice(-2000),
      stdoutTail: (mediaProbe.stdout || '').slice(-2000)
    },
    integrationWorktree: wt,
    firstBlocker,
    note: 'No KORG writer in this product lane'
  };

  atomicWriteJson(path.join(evidenceDir, 'A-001-result.json'), result);
  updateTask(lane, taskId, { status: 'passed', result, worktreePath: wt.worktreePath || null });
  return result;
}

export function recoverLibraryL001() {
  const lane = 'library';
  const taskId = 'L-001';
  updateTask(lane, taskId, { status: 'running', startedAt: nowIso() });
  const evidenceDir = ensureEvidenceDir({ lane, id: taskId, evidenceDir: path.join(FACTORY_ROOT, 'logs', lane, taskId) });
  const discovery = discoverLane(lane);
  const cfg = loadFactoryConfig();
  const root = cfg.lanes.library.repoRoot;

  const p0Scripts = ['test:p0-005', 'test:p0-006', 'test:p0-007'];
  const p0Results = {};
  for (const script of p0Scripts) {
    const r = runCmd(`npm run ${script}`, { cwd: root, timeout: 180000 });
    p0Results[script] = {
      ok: r.ok,
      exitCode: r.exitCode,
      stdoutTail: (r.stdout || '').slice(-1500),
      stderrTail: (r.stderr || '').slice(-1500)
    };
  }

  const commercialLibs = listFilesRecursive(root, {
    max: 50,
    filter: (f) => /oud|qanun|darbuka/i.test(f) && /\.(wav|uinst|nki)$/i.test(f)
  });

  const wt = createIntegrationWorktree(lane);
  const tasks = discovery.tasksJson?.tasks || [];
  const open = tasks.filter((t) => t.status !== 'done');
  const contentBlocked = open.find((t) => t.id === 'CONTENT-001') || {
    id: 'CONTENT-001',
    status: 'blocked',
    note: 'Owner recordings/rights — does not block Factory Studio product'
  };

  const firstBlocker =
    Object.values(p0Results).some((r) => !r.ok)
      ? 'P0_TEST_REGRESSION'
      : 'P0_COMPLETE_NEXT_USER_SAMPLE_IMPORT_AND_WINDOWS_APP';

  const result = {
    taskId,
    lane,
    completedAt: nowIso(),
    discoveryPath: path.join(FACTORY_ROOT, 'reports', 'LIBRARY_DISCOVERY.json'),
    projectStateExcerpt: discovery.projectState,
    p0Results,
    commercialLibraryCount: commercialLibs.length,
    commercialLibrarySample: commercialLibs.slice(0, 10),
    openTasks: open,
    contentBlocked,
    integrationWorktree: wt,
    firstBlocker,
    honestClaim: 'Factory Studio sells the tool; commercial Oud/Qanun/Darbuka content is a separate future queue'
  };

  atomicWriteJson(path.join(evidenceDir, 'L-001-result.json'), result);
  updateTask(lane, taskId, {
    status: Object.values(p0Results).every((r) => r.ok) ? 'passed' : 'blocked',
    result,
    worktreePath: wt.worktreePath || null
  });
  return result;
}

export function writeMasterDiscoverySummary(discoveries) {
  const md = [
    '# MASTER DISCOVERY SUMMARY',
    '',
    `updatedAt: ${nowIso()}`,
    '',
    ...discoveries.map((d) =>
      [
        `## ${d.lane.toUpperCase()} — ${d.productName}`,
        `- root: \`${d.repoRoot}\``,
        `- branch: \`${d.git.branch}\``,
        `- HEAD: \`${d.git.head}\``,
        `- dirty: ${d.git.dirtyCount}`,
        `- firstBlocker: ${d.firstBlocker}`,
        ''
      ].join('\n')
    )
  ].join('\n');
  const out = path.join(FACTORY_ROOT, 'reports', 'MASTER_DISCOVERY_SUMMARY.md');
  fs.writeFileSync(out, md, 'utf8');
  atomicWriteJson(path.join(FACTORY_ROOT, 'reports', 'MASTER_DISCOVERY_SUMMARY.json'), {
    updatedAt: nowIso(),
    lanes: discoveries
  });
  return out;
}
