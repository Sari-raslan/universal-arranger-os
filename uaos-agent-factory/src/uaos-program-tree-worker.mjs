#!/usr/bin/env node
/**
 * UAOS Program Tree Worker — executes one claimed READY task inside its worktree.
 * Writes contract stub + tests + evidence. Never touches protected worktrees.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

function arg(name){
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i+1] : null;
}
function now(){ return new Date().toISOString(); }
function ensure(d){ fs.mkdirSync(d,{recursive:true}); }
function readJson(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function writeJson(p, obj){ ensure(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj,null,2)+'\n','utf8'); }
function sha(s){ return crypto.createHash('sha256').update(s).digest('hex').toUpperCase(); }

const TREE = process.env.UAOS_PROGRAM_TREE || 'C:\\keyboard-manager-clean\\uaos-program-tree';
const RUNTIME = process.env.UAOS_PROGRAM_RUNTIME || 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\program-tree';
const taskId = arg('--task-id');
const agentId = arg('--agent-id') || 'NODE_LOCAL_WORKER';
const runDir = arg('--run-dir');
const taskFile = arg('--task-file');
if ((!taskId && !taskFile) || !runDir) {
  console.error('USAGE: --task-id|--task-file --run-dir [--agent-id]');
  process.exit(2);
}

function loadTask() {
  if (taskFile) return readJson(taskFile);
  // Prefer per-task snapshot to avoid concurrent TASKS.json races.
  const snap = path.join(RUNTIME, 'task-snapshots', `${taskId}.json`);
  if (fs.existsSync(snap)) return readJson(snap);
  const tasksDoc = readJson(path.join(TREE, 'TASKS.json'));
  return (tasksDoc.tasks || []).find(t => t.id === taskId) || null;
}
const task = loadTask();
if (!task) {
  console.error('TASK_NOT_FOUND', taskId || taskFile);
  process.exit(3);
}

const forbiddenRoots = [
  'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v15-execution',
  'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v16-execution',
  'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v17-execution',
  'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v18-execution',
  'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v19-integration',
  'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v20-review',
  'C:\\UAOS_AGENT_FACTORY_WORKTREES\\platform-v21-execution'
];
for (const root of forbiddenRoots) {
  if (String(task.worktree).toLowerCase().startsWith(root.toLowerCase())) {
    console.error('PROTECTED_WORKTREE_WRITE_DENIED');
    process.exit(4);
  }
}

const startedAt = now();
writeJson(path.join(RUNTIME, 'heartbeats', `${taskId}.json`), { taskId, agentId, at: startedAt });

ensure(task.worktree);
ensure(path.join(task.worktree, 'src'));
ensure(path.join(task.worktree, 'tests'));
ensure(path.join(task.worktree, 'evidence'));

const moduleName = path.basename(task.ownerFile);
const implPath = path.join(task.worktree, 'src', moduleName.endsWith('.mjs') ? moduleName : `${moduleName}.mjs`);
const contract = {
  taskId: task.id,
  title: task.title,
  domain: task.domain,
  phase: task.phase,
  releaseTrain: task.releaseTrain,
  gate: task.gate,
  truth: [
    'Technical WAV success does not prove musical quality',
    'Fixtures are not product content',
    'Studio Offline Render is not Real-time DSP',
    'KORG WRITE_UNSUPPORTED',
    'No auto adoption of Kids/Teen/Pricing',
    'Commander not activated'
  ],
  acceptanceCriteria: task.acceptanceCriteria,
  implementedAt: now(),
  status: 'CONTRACT_STUB_EXECUTED'
};

const implSource = `export const contract = ${JSON.stringify(contract, null, 2)};
export function verify() {
  if (!contract.taskId) throw new Error('missing taskId');
  if (!Array.isArray(contract.acceptanceCriteria) || contract.acceptanceCriteria.length < 1) throw new Error('missing acceptance');
  return { ok: true, taskId: contract.taskId };
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(verify()));
}
import { pathToFileURL } from 'node:url';
`;
// Fix order - pathToFileURL import must be top. Rewrite cleanly:
const implSourceClean = `import { pathToFileURL } from 'node:url';
export const contract = ${JSON.stringify(contract, null, 2)};
export function verify() {
  if (!contract.taskId) throw new Error('missing taskId');
  if (!Array.isArray(contract.acceptanceCriteria) || contract.acceptanceCriteria.length < 1) throw new Error('missing acceptance');
  return { ok: true, taskId: contract.taskId, title: contract.title };
}
const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) console.log(JSON.stringify(verify()));
`;
fs.writeFileSync(implPath, implSourceClean, 'utf8');

const testPath = path.join(task.worktree, 'tests', 'main.test.mjs');
fs.writeFileSync(testPath, `import test from 'node:test';
import assert from 'node:assert/strict';
import { verify, contract } from '../src/${path.basename(implPath)}';

test('${task.id} verify', () => {
  const r = verify();
  assert.equal(r.ok, true);
  assert.equal(r.taskId, '${task.id}');
  assert.ok(contract.acceptanceCriteria.length >= 1);
});
`, 'utf8');

writeJson(path.join(RUNTIME, 'heartbeats', `${taskId}.json`), { taskId, agentId, at: now(), stage: 'TESTING' });
const testRun = spawnSync(process.execPath, ['--test', testPath], { encoding: 'utf8', cwd: task.worktree });
const testOk = testRun.status === 0;

const evidence = {
  taskId,
  agentId,
  startedAt,
  endedAt: now(),
  status: testOk ? 'PASS' : 'FAIL',
  tests: [{ command: `node --test ${testPath}`, exitCode: testRun.status, stdoutTail: (testRun.stdout || '').slice(-1500) }],
  sha256: sha(JSON.stringify(contract)),
  allowedPathsUsed: [task.worktree, implPath, testPath],
  truthStatements: contract.truth,
  ownerFile: implPath,
  phase: task.phase,
  gate: task.gate,
  noPush: true,
  noMerge: true,
  noDeploy: true,
  commanderActivated: false
};
writeJson(path.join(task.worktree, 'evidence', 'result.json'), evidence);
writeJson(path.join(runDir, 'task-results', taskId, 'evidence.json'), evidence);
writeJson(path.join(RUNTIME, 'heartbeats', `${taskId}.json`), { taskId, agentId, at: now(), stage: 'DONE', ok: testOk });

if (!testOk) {
  console.error(testRun.stdout || '');
  console.error(testRun.stderr || '');
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, taskId, evidence: path.join(task.worktree, 'evidence', 'result.json') }));
