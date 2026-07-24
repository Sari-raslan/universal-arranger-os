import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveBuildRoot } from '../paths.mjs';

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const lane = arg('--lane', 'library');
const task = arg('--task', 'L-010');
const worktree = arg('--worktree');
const artifact = arg('--artifact');
const evidence = arg('--evidence');
const assigned = arg('--assigned-agent', 'cursor-local');

function run(cmd, cwd) {
  const r = spawnSync(cmd, {
    cwd,
    shell: true,
    encoding: 'utf8',
    timeout: 300000,
    env: { ...process.env, TEMP: path.join(resolveBuildRoot(), 'tmp'), TMP: path.join(resolveBuildRoot(), 'tmp') }
  });
  return {
    cmd,
    exitCode: r.status ?? 1,
    ok: (r.status ?? 1) === 0,
    stdoutTail: (r.stdout || '').slice(-2500),
    stderrTail: (r.stderr || '').slice(-2500)
  };
}

fs.mkdirSync(artifact, { recursive: true });
fs.mkdirSync(evidence, { recursive: true });

const tests = [
  run('npm run test:p0-005', worktree),
  run('npm run test:p0-006', worktree),
  run('npm run test:p0-007', worktree)
];
const check = run('npm run check', worktree);

const allP0 = tests.every((t) => t.ok);
const result = {
  ok: allP0,
  status: allP0 ? 'PASS' : 'FAIL',
  task,
  lane,
  assignedAgent: assigned,
  mode: 'physical_verification_no_reimplement',
  completedAt: new Date().toISOString(),
  worktree,
  p0: {
    'L-010': tests[0],
    'L-020': tests[1],
    'L-030': tests[2]
  },
  check,
  commercialLibraries: 0,
  note: allP0
    ? 'P0-005/006/007 physically re-verified PASS; mark L-010/L-020/L-030 integrated without empty commits; advance to L-040'
    : 'One or more P0 verifications failed — reopen only failing task',
  nextTask: allP0 ? 'L-040' : null,
  integrated: allP0
};

const out1 = path.join(artifact, 'L-P0-VERIFY-result.json');
const out2 = path.join(artifact, `${task}-result.json`);
const out3 = path.join(evidence, `${task}-result.json`);
for (const p of [out1, out2, out3]) {
  fs.writeFileSync(p, `${JSON.stringify(result, null, 2)}\n`);
}

// Side-effect markers for L-020/L-030 when L-010 runner used for bundle verify
if (allP0) {
  for (const id of ['L-010', 'L-020', 'L-030']) {
    fs.writeFileSync(
      path.join(artifact, `${id}-result.json`),
      `${JSON.stringify({ ...result, task: id, status: 'PASS', ok: true, integrated: true }, null, 2)}\n`
    );
  }
}

console.log(JSON.stringify({ status: result.status, task, exit: allP0 ? 0 : 1 }));
process.exit(allP0 ? 0 : 1);
