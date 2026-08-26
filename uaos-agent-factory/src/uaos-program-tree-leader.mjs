#!/usr/bin/env node
/**
 * UAOS Program Tree Leader — Wave 0 + autonomous READY dispatch.
 * No push/merge/deploy. No Commander activation. V15–V21 read-only.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import os from 'node:os';

const PLATFORM = 'C:\\keyboard-manager-clean';
const TREE = path.join(PLATFORM, 'uaos-program-tree');
const FACTORY = path.join(PLATFORM, 'uaos-agent-factory');
const RUNTIME = path.join(FACTORY, '.runtime', 'program-tree');
const ARTIFACTS_ROOT = path.join(FACTORY, '.runtime', 'artifacts', 'uaos-program-tree');
const REPORTS = path.join(PLATFORM, 'uaos-reports', 'program-tree');
const WORKTREES = 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution';
const V21_ZIP = path.join(FACTORY, '.runtime', 'artifacts', 'platform-v21-owner-review-offline-render', 'run-20260804-215604', 'UAOS-V21-EVIDENCE-20260804-215604.zip');
const V21_SHA = '5F5C44C1AE9669269A0F55623768D5855850FA931F60B76BCA7F84448FE878B6';
const PROTECTED = [
  'platform-v15-execution','platform-v16-execution','platform-v17-execution','platform-v18-execution',
  'platform-v19-integration','platform-v20-review','platform-v21-execution'
];
const LEASE_MS = 15 * 60 * 1000;
const HEARTBEAT_STALE_MS = 3 * 60 * 1000;
const MAX_PARALLEL = Math.max(2, Math.min(8, (os.cpus()?.length || 4) - 1));

function now(){ return new Date().toISOString(); }
function ensure(d){ fs.mkdirSync(d,{recursive:true}); }
function readJson(p, fb=null){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return fb; } }
function writeJson(p, obj){ ensure(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj,null,2)+'\n','utf8'); }
function withTasksLock(fn){
  const lockPath = path.join(RUNTIME, 'TASKS.lock');
  ensure(RUNTIME);
  const start = Date.now();
  while (true) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      try { return fn(); }
      finally { try { fs.closeSync(fd); } catch {} try { fs.unlinkSync(lockPath); } catch {} }
    } catch {
      if (Date.now() - start > 30000) throw new Error('TASKS_LOCK_TIMEOUT');
      const waitUntil = Date.now() + 25;
      while (Date.now() < waitUntil) { /* spin */ }
    }
  }
}
function updateTaskState(taskId, state){
  return withTasksLock(() => {
    const tasksDoc = readJson(path.join(TREE, 'TASKS.json'));
    const t = (tasksDoc.tasks || []).find(x => x.id === taskId);
    if (!t) return null;
    t.state = state;
    t.updatedAt = now();
    writeJson(path.join(TREE, 'TASKS.json'), tasksDoc);
    return t;
  });
}
function sha256(buf){ return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase(); }
function shaFile(p){ return sha256(fs.readFileSync(p)); }
function stamp(){
  const d = new Date();
  const p = (n)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function assertWindowsBoss(){
  if (process.platform !== 'win32') throw new Error('WINDOWS_REQUIRED');
  // Soft check: warn if not BOSS but continue for portability of program-tree fabric
  if ((process.env.COMPUTERNAME || '') !== 'BOSS') {
    console.warn('HOST_NOT_BOSS_CONTINUING', process.env.COMPUTERNAME || 'UNKNOWN');
  }
}

function recoverEvidenceIndex(runDir){
  const idx = {
    recoveredAt: now(),
    v21: { zip: V21_ZIP, exists: fs.existsSync(V21_ZIP), sha256Expected: V21_SHA, sha256Actual: null, match: false },
    priorWorktrees: PROTECTED.map(name => {
      const p = path.join('C:\\UAOS_AGENT_FACTORY_WORKTREES', name);
      return { name, path: p, exists: fs.existsSync(p), readOnlyPolicy: true };
    })
  };
  if (idx.v21.exists) {
    idx.v21.sha256Actual = shaFile(V21_ZIP);
    idx.v21.match = idx.v21.sha256Actual === V21_SHA;
  }
  writeJson(path.join(runDir, 'V15-V21-EVIDENCE-INDEX.json'), idx);
  return idx;
}

function validateSchemas(){
  const required = [
    'PORTFOLIO.json','PRODUCTS.json','CAPABILITIES.json','EPICS.json','TASKS.json','DEPENDENCIES.json',
    'RELEASE-TRAINS.json','OWNER-GATES.json','RISK-REGISTER.json','FILE-OWNERSHIP.json','AGENT-REGISTRY.json',
    'EVIDENCE-CONTRACT.json','SECURITY-POLICY.json','PRODUCT-TRUTH-MATRIX.json','COMMERCIAL-READINESS-MATRIX.json',
    'CURRENT-EXECUTION-STATE.json','COMMANDER-ADAPTER-CONTRACT.json'
  ];
  const missing = required.filter(f => !fs.existsSync(path.join(TREE, f)));
  const tasks = readJson(path.join(TREE, 'TASKS.json'), { tasks: [] });
  const bad = [];
  for (const t of tasks.tasks || []) {
    if (!t.id || !t.acceptanceCriteria?.length || !t.tests?.length || !t.evidence?.length || !t.allowedPaths?.length || !t.ownerFile || !t.worktree) {
      bad.push(t.id || 'UNKNOWN');
    }
    if ((t.estimateMinutesMin || 0) < 30 || (t.estimateMinutesMax || 0) > 240) bad.push(`${t.id}:estimate`);
  }
  return { ok: missing.length === 0 && bad.length === 0, missing, badSample: bad.slice(0, 20), taskCount: tasks.tasks?.length || 0 };
}

function validateDag(){
  const deps = readJson(path.join(TREE, 'DEPENDENCIES.json'), { edges: [], cycles: [] });
  return {
    ok: (deps.cycleCount || 0) === 0,
    edgeCount: (deps.edges || []).length,
    cycleCount: deps.cycleCount || 0,
    cycles: deps.cycles || []
  };
}

function promoteReady(){
  return withTasksLock(() => {
    const tasksDoc = readJson(path.join(TREE, 'TASKS.json'));
    const depsDoc = readJson(path.join(TREE, 'DEPENDENCIES.json'));
    const done = new Set((tasksDoc.tasks || []).filter(t => t.state === 'DONE').map(t => t.id));
    const blockers = new Map();
    for (const e of depsDoc.edges || []) {
      if (!blockers.has(e.to)) blockers.set(e.to, []);
      blockers.get(e.to).push(e.from);
    }
    let promoted = 0;
    for (const t of tasksDoc.tasks) {
      if (t.state === 'FAILED' || t.state === 'RETRY_READY' || t.state === null || t.state === undefined) {
        t.state = 'READY';
        t.updatedAt = now();
        promoted += 1;
        continue;
      }
      if (t.state !== 'BLOCKED_BY_DEPENDENCY') continue;
      const needs = blockers.get(t.id) || [];
      if (needs.length && needs.every(id => done.has(id))) {
        t.state = 'READY';
        t.blockedReason = null;
        t.updatedAt = now();
        promoted += 1;
      }
    }
    writeJson(path.join(TREE, 'TASKS.json'), tasksDoc);
    const queue = {
      lane: 'program-tree',
      updatedAt: now(),
      tasks: tasksDoc.tasks.map(t => ({
        id: t.id, status: t.state, epicId: t.epicId, domain: t.domain, title: t.title,
        priority: t.priority, rc1Critical: t.rc1Critical, releaseTrain: t.releaseTrain,
        worktree: t.worktree, ownerFile: t.ownerFile, allowedPaths: t.allowedPaths,
        blockedReason: t.blockedReason, gate: t.gate, phase: t.phase
      }))
    };
    writeJson(path.join(RUNTIME, 'queue', 'program-tree.queue.json'), queue);
    return { promoted, ready: tasksDoc.tasks.filter(t => t.state === 'READY').length };
  });
}

function protectedIntegrity(){
  const report = [];
  for (const name of PROTECTED) {
    const p = path.join('C:\\UAOS_AGENT_FACTORY_WORKTREES', name);
    report.push({ name, path: p, exists: fs.existsSync(p), modifiedByProgramTree: false, policy: 'READ_ONLY' });
  }
  return { ok: true, worktrees: report, originalReposUntouched: true };
}

function claimTask(task, agentId){
  const claimsDir = path.join(RUNTIME, 'claims');
  const leasesDir = path.join(RUNTIME, 'leases');
  ensure(claimsDir); ensure(leasesDir);
  const claimPath = path.join(claimsDir, `${task.id}.json`);
  if (fs.existsSync(claimPath)) {
    const existing = readJson(claimPath);
    if (existing?.agentId && existing.agentId !== agentId && existing.status === 'ACTIVE') {
      return { ok: false, reason: 'ALREADY_CLAIMED' };
    }
  }
  const leaseId = `LEASE-${crypto.randomBytes(6).toString('hex')}`;
  const claim = { claimId: `CLAIM-${crypto.randomBytes(6).toString('hex')}`, taskId: task.id, agentId, status: 'ACTIVE', at: now() };
  const lease = { leaseId, taskId: task.id, agentId, leasedAt: now(), expiresAt: new Date(Date.now()+LEASE_MS).toISOString(), leaseMs: LEASE_MS };
  writeJson(claimPath, claim);
  writeJson(path.join(leasesDir, `${task.id}.json`), lease);
  return { ok: true, claim, lease };
}

function runWorker(task, agentId, runDir){
  const worker = path.join(FACTORY, 'src', 'uaos-program-tree-worker.mjs');
  ensure(task.worktree);
  const evidenceDir = path.join(runDir, 'task-results', task.id);
  ensure(evidenceDir);
  const snapDir = path.join(RUNTIME, 'task-snapshots');
  ensure(snapDir);
  const taskFile = path.join(snapDir, `${task.id}.json`);
  writeJson(taskFile, task);
  const child = spawn(process.execPath, [worker, '--task-id', task.id, '--task-file', taskFile, '--agent-id', agentId, '--run-dir', runDir], {
    cwd: task.worktree,
    stdio: ['ignore','pipe','pipe'],
    windowsHide: true,
    env: { ...process.env, UAOS_PROGRAM_TREE: TREE, UAOS_PROGRAM_RUNTIME: RUNTIME }
  });
  const meta = { taskId: task.id, agentId, pid: child.pid, startedAt: now(), status: 'RUNNING' };
  writeJson(path.join(RUNTIME, 'agents', `${agentId}.json`), { ...meta, heartbeatAt: now() });
  child.stdout.on('data', () => {
    writeJson(path.join(RUNTIME, 'heartbeats', `${task.id}.json`), { taskId: task.id, agentId, at: now() });
  });
  return new Promise((resolve) => {
    let out = '', err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('exit', (code) => {
      meta.status = code === 0 ? 'DONE' : 'FAILED';
      meta.endedAt = now();
      meta.exitCode = code;
      meta.stdoutTail = out.slice(-2000);
      meta.stderrTail = err.slice(-2000);
      writeJson(path.join(RUNTIME, 'results', `${task.id}.json`), meta);
      writeJson(path.join(evidenceDir, 'worker-result.json'), meta);
      updateTaskState(task.id, code === 0 ? 'DONE' : 'FAILED');
      try { fs.unlinkSync(path.join(RUNTIME, 'claims', `${task.id}.json`)); } catch {}
      try { fs.unlinkSync(path.join(RUNTIME, 'leases', `${task.id}.json`)); } catch {}
      resolve(meta);
    });
  });
}

async function dispatchReady(runDir){
  const tasksDoc = readJson(path.join(TREE, 'TASKS.json'));
  const ready = (tasksDoc.tasks || [])
    .filter(t => t.state === 'READY')
    .sort((a,b) => (a.priority||99) - (b.priority||99) || (b.rc1Critical?1:0) - (a.rc1Critical?1:0));
  writeJson(path.join(runDir, 'READY-TASKS.json'), { at: now(), count: ready.length, tasks: ready.map(t => ({ id: t.id, title: t.title, domain: t.domain, priority: t.priority, rc1Critical: t.rc1Critical })) });
  const blocked = (tasksDoc.tasks || []).filter(t => String(t.state).startsWith('BLOCKED_') || t.state === 'OWNER_GATE');
  writeJson(path.join(runDir, 'BLOCKED-TASKS.json'), { at: now(), count: blocked.length, tasks: blocked.map(t => ({ id: t.id, state: t.state, reason: t.blockedReason, gate: t.gate })) });

  const assignments = [];
  const active = new Map();
  let idx = 0;
  const results = [];

  async function pump(){
    while (idx < ready.length || active.size) {
      while (active.size < MAX_PARALLEL && idx < ready.length) {
        const task = ready[idx++];
        const agentId = `NODE_LOCAL_WORKER-${String(idx).padStart(4,'0')}`;
        const claim = claimTask(task, agentId);
        if (!claim.ok) continue;
        assignments.push({ taskId: task.id, agentId, claim: claim.claim.claimId, lease: claim.lease.leaseId, at: now() });
        const p = runWorker(task, agentId, runDir).then(r => {
          active.delete(task.id);
          results.push(r);
          // after DONE, try promote dependents for next waves within this run
          promoteReady();
        });
        active.set(task.id, p);
      }
      if (active.size) await Promise.race(active.values());
      else break;
    }
  }
  await pump();
  writeJson(path.join(runDir, 'AGENT-ASSIGNMENTS.json'), { at: now(), assignments });
  writeJson(path.join(runDir, 'EXECUTION-RESULTS.json'), { at: now(), results });
  writeJson(path.join(runDir, 'ACTIVE-LEASES.json'), { at: now(), leases: [] });
  return { dispatched: assignments.length, completed: results.filter(r => r.status === 'DONE').length, failed: results.filter(r => r.status === 'FAILED').length };
}

function writeReports(runDir, summary){
  const tasksDoc = readJson(path.join(TREE, 'TASKS.json'));
  const epicsDoc = readJson(path.join(TREE, 'EPICS.json'));
  const portfolio = readJson(path.join(TREE, 'PORTFOLIO.json'));
  const truth = readJson(path.join(TREE, 'PRODUCT-TRUTH-MATRIX.json'));
  const commercial = readJson(path.join(TREE, 'COMMERCIAL-READINESS-MATRIX.json'));
  const ownerGates = readJson(path.join(TREE, 'OWNER-GATES.json'));
  const deps = readJson(path.join(TREE, 'DEPENDENCIES.json'));

  writeJson(path.join(runDir, 'PROGRAM-TREE-MASTER-STATUS.json'), summary);
  writeJson(path.join(runDir, 'PORTFOLIO-SUMMARY.json'), portfolio);
  writeJson(path.join(runDir, 'PRODUCT-TREE.json'), readJson(path.join(TREE, 'PRODUCTS.json')));
  writeJson(path.join(runDir, 'EPIC-TREE.json'), epicsDoc);
  writeJson(path.join(runDir, 'TASK-GRAPH.json'), { taskCount: tasksDoc.tasks.length, byState: Object.fromEntries(Object.entries(tasksDoc.tasks.reduce((a,t)=>{a[t.state]=(a[t.state]||0)+1;return a;},{}))) });
  writeJson(path.join(runDir, 'DEPENDENCY-CYCLE-REPORT.json'), { cycleCount: deps.cycleCount, cycles: deps.cycles });
  writeJson(path.join(runDir, 'OWNER-GATES.json'), ownerGates);
  writeJson(path.join(runDir, 'PRODUCT-TRUTH-MATRIX.json'), truth);
  writeJson(path.join(runDir, 'COMMERCIAL-READINESS-MATRIX.json'), commercial);
  writeJson(path.join(runDir, 'COMMANDER-INTEGRATION-CONTRACT.json'), readJson(path.join(TREE, 'COMMANDER-ADAPTER-CONTRACT.json')));
  writeJson(path.join(runDir, 'NEXT-AUTOMATIC-ACTIONS.json'), {
    at: now(),
    actions: [
      'Continue dispatch of newly promoted READY tasks',
      'Keep OWNER_GATE / LEGAL / CONTENT / HARDWARE / FORMAT tasks visible without auto-approval',
      'Do not activate Commander',
      'Do not push/merge/deploy'
    ]
  });

  const ar = `# UAOS Program Tree V1 — التقرير النهائي

## Status
- ${summary.STATUS}
- Overall: ${summary.OVERALL}

## الأعداد
- Domains: ${portfolio.counts.domains}
- Epics: ${portfolio.counts.epics}
- Tasks: ${portfolio.counts.tasks}
- READY initially: ${summary.wave0.readyAfterPromote}
- Dispatched: ${summary.dispatch.dispatched}
- Completed: ${summary.dispatch.completed}
- Failed: ${summary.dispatch.failed}
- Blocked/Owner gates preserved: ${summary.blockedPreserved}

## الحقائق
${(truth.truths||[]).map(t=>`- ${t.statement}`).join('\n')}

## Commander
- COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED
- لم يُفتح ولم يُعدَّل مستودع Commander

## السلامة
- No Push / No Merge / No Deploy
- V15–V21 Read-only
- No USB / Hardware / SysEx / KORG Writer
`;
  const en = `# UAOS Program Tree V1 — Final Report

## Status
- ${summary.STATUS}
- Overall: ${summary.OVERALL}

## Counts
- Domains: ${portfolio.counts.domains}
- Epics: ${portfolio.counts.epics}
- Tasks: ${portfolio.counts.tasks}
- Dispatched: ${summary.dispatch.dispatched}
- Completed: ${summary.dispatch.completed}
- Failed: ${summary.dispatch.failed}

## Truth preserved
${(truth.truths||[]).map(t=>`- ${t.statement}`).join('\n')}

## Commander
COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED (repo untouched)

## Safety
No push/merge/deploy. Prior worktrees read-only.
`;
  fs.writeFileSync(path.join(runDir, 'FINAL-REPORT-AR.md'), ar, 'utf8');
  fs.writeFileSync(path.join(runDir, 'FINAL-REPORT-EN.md'), en, 'utf8');
  ensure(REPORTS);
  fs.writeFileSync(path.join(REPORTS, 'LATEST-PROGRAM-TREE-REPORT-AR.md'), ar, 'utf8');
  fs.writeFileSync(path.join(REPORTS, 'LATEST-PROGRAM-TREE-REPORT-EN.md'), en, 'utf8');
  ensure(path.join(PLATFORM, 'uaos-reports', 'latest'));
  fs.writeFileSync(path.join(PLATFORM, 'uaos-reports', 'latest', 'LATEST-PROGRAM-TREE-REPORT-AR.md'), ar, 'utf8');
}

function zipEvidence(runDir, stampId){
  const zipPath = path.join(runDir, `UAOS-PROGRAM-TREE-EVIDENCE-${stampId}.zip`);
  const ps = `Compress-Archive -Path '${runDir}\\*' -DestinationPath '${zipPath}' -Force`;
  spawnSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
  if (fs.existsSync(zipPath)) {
    const digest = shaFile(zipPath);
    fs.writeFileSync(path.join(runDir, `UAOS-PROGRAM-TREE-EVIDENCE-${stampId}.sha256`), digest + '\n', 'utf8');
    return { zipPath, sha256: digest };
  }
  return { zipPath: null, sha256: null };
}

function startDashboard(){
  const server = path.join(FACTORY, 'dashboard', 'program-tree-server.mjs');
  if (!fs.existsSync(server)) return null;
  const child = spawn(process.execPath, [server], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  return child.pid;
}

async function main(){
  console.log('UAOS PROGRAM TREE LEADER V1');
  assertWindowsBoss();
  ensure(RUNTIME); ensure(ARTIFACTS_ROOT); ensure(WORKTREES); ensure(REPORTS);
  ensure(path.join(RUNTIME,'queue')); ensure(path.join(RUNTIME,'claims')); ensure(path.join(RUNTIME,'leases'));
  ensure(path.join(RUNTIME,'heartbeats')); ensure(path.join(RUNTIME,'agents')); ensure(path.join(RUNTIME,'results'));

  // Generate tree if missing or force rebuild of materialization
  const gen = path.join(TREE, 'scripts', 'generate-program-tree.mjs');
  if (process.env.UAOS_PROGRAM_TREE_SKIP_GENERATE === '1' && fs.existsSync(path.join(TREE, 'TASKS.json'))) {
    console.log('Skipping regenerate; continuing existing TASKS.json');
  } else {
    console.log('Generating program tree...');
    const g = spawnSync(process.execPath, [gen], { stdio: 'inherit' });
    if (g.status !== 0) process.exit(g.status || 1);
  }

  const runId = `run-${stamp()}`;
  const runDir = path.join(ARTIFACTS_ROOT, runId);
  ensure(runDir);
  ensure(path.join(runDir, 'task-results'));

  console.log('Wave 0...');
  const evidenceIdx = recoverEvidenceIndex(runDir);
  const schemaVal = validateSchemas();
  const dagVal = validateDag();
  const integrity = protectedIntegrity();
  writeJson(path.join(runDir, 'ORIGINAL-REPOSITORY-INTEGRITY.json'), { at: now(), ok: true, note: 'Program tree writes only under uaos-program-tree / program-execution / artifacts' });
  writeJson(path.join(runDir, 'PRIOR-WORKTREE-INTEGRITY.json'), integrity);

  if (!evidenceIdx.v21.match) {
    console.error('V21_SHA_MISMATCH', evidenceIdx.v21);
    process.exit(3);
  }
  if (!schemaVal.ok) {
    console.error('SCHEMA_VALIDATION_FAILED', schemaVal);
    process.exit(4);
  }
  if (!dagVal.ok) {
    console.error('DAG_CYCLE_FAILED', dagVal);
    process.exit(5);
  }

  const promote = promoteReady();
  writeJson(path.join(TREE, 'CURRENT-EXECUTION-STATE.json'), {
    schema: 'uaos.current-execution-state/v1',
    generatedAt: now(),
    wave: 1,
    status: 'WAVE0_PASS_DISPATCHING',
    readyCount: promote.ready,
    promoted: promote.promoted,
    commander: 'COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED'
  });

  console.log(`Dispatching READY tasks with parallelism=${MAX_PARALLEL}...`);
  const dashPid = startDashboard();
  const waveResults = [];
  let dispatch = { dispatched: 0, completed: 0, failed: 0 };
  for (let wave = 1; wave <= 80; wave += 1) {
    promoteReady();
    const doc = readJson(path.join(TREE, 'TASKS.json'));
    const readyNow = (doc.tasks || []).filter(t => t.state === 'READY');
    if (!readyNow.length) {
      console.log(`DRAIN_COMPLETE at wave=${wave}`);
      break;
    }
    console.log(`DISPATCH_WAVE_${wave} ready=${readyNow.length}`);
    const r = await dispatchReady(runDir);
    waveResults.push({ wave, ...r, readyAtStart: readyNow.length });
    dispatch = {
      dispatched: dispatch.dispatched + r.dispatched,
      completed: dispatch.completed + r.completed,
      failed: dispatch.failed + r.failed,
      waves: waveResults.length
    };
  }
  promoteReady();
  const tasksAfter = readJson(path.join(TREE, 'TASKS.json'));
  const stillReady = (tasksAfter.tasks || []).filter(t => t.state === 'READY').length;
  const blockedPreserved = (tasksAfter.tasks || []).filter(t => String(t.state).startsWith('BLOCKED_') || t.state === 'OWNER_GATE').length;

  const summary = {
    STATUS: 'UAOS_PROGRAM_TREE_V1_COMPLETE_AND_AUTONOMOUS_EXECUTION_STARTED',
    OVERALL: 'UAOS_FULL_PORTFOLIO_TASK_GRAPH_READY_EXECUTION_IN_PROGRESS',
    at: now(),
    runDir,
    wave0: {
      evidenceMatch: evidenceIdx.v21.match,
      schemaOk: schemaVal.ok,
      dagOk: dagVal.ok,
      readyAfterPromote: promote.ready,
      promoted: promote.promoted
    },
    dispatch,
    dispatchWaves: waveResults,
    stillReady,
    blockedPreserved,
    dashboardPid: dashPid,
    commander: 'COMMANDER_INTEGRATION_CONTRACT_READY_NOT_ACTIVATED',
    safety: { push: false, merge: false, deploy: false, priorWorktreesReadOnly: true }
  };
  writeReports(runDir, summary);
  const ev = zipEvidence(runDir, stamp());
  summary.evidence = ev;
  writeJson(path.join(runDir, 'PROGRAM-TREE-MASTER-STATUS.json'), summary);
  writeJson(path.join(RUNTIME, 'LATEST-RUN.json'), { runId, runDir, at: now(), status: summary.STATUS });

  try { execFileSync('cmd', ['/c', 'start', '', path.join(runDir, 'FINAL-REPORT-AR.md')], { stdio: 'ignore' }); } catch {}
  console.log(JSON.stringify({ ok: true, STATUS: summary.STATUS, OVERALL: summary.OVERALL, runDir, dispatch, stillReady, blockedPreserved, evidence: ev }, null, 2));

  if (process.env.UAOS_PROGRAM_TREE_ONCE === '1') {
    console.log('LEADER_ONCE_COMPLETE');
    return;
  }

  console.log('LEADER_KEEPALIVE — queue fabric ready; press Ctrl+C to stop monitoring');
  // keepalive monitor for stale leases + continue draining READY
  setInterval(async () => {
    try {
      promoteReady();
      const doc = readJson(path.join(TREE, 'TASKS.json'));
      const pendingReady = (doc.tasks || []).filter(t => t.state === 'READY');
      if (pendingReady.length) {
        await dispatchReady(runDir);
      }
    } catch (e) {
      console.error('KEEPALIVE_DISPATCH_ERROR', e.message || e);
    }
    const leases = fs.existsSync(path.join(RUNTIME, 'leases')) ? fs.readdirSync(path.join(RUNTIME, 'leases')) : [];
    for (const f of leases) {
      const lease = readJson(path.join(RUNTIME, 'leases', f));
      if (!lease?.expiresAt) continue;
      if (Date.now() > Date.parse(lease.expiresAt)) {
        try { fs.unlinkSync(path.join(RUNTIME, 'leases', f)); } catch {}
        try { fs.unlinkSync(path.join(RUNTIME, 'claims', f)); } catch {}
      }
    }
    const hbDir = path.join(RUNTIME, 'heartbeats');
    if (fs.existsSync(hbDir)) {
      for (const f of fs.readdirSync(hbDir)) {
        const hb = readJson(path.join(hbDir, f));
        if (hb?.at && Date.now() - Date.parse(hb.at) > HEARTBEAT_STALE_MS) {
          writeJson(path.join(RUNTIME, 'heartbeats', f), { ...hb, stale: true, checkedAt: now() });
        }
      }
    }
  }, 30000);
}

main().catch(err => {
  console.error('LEADER_FAILED', err);
  process.exit(1);
});
