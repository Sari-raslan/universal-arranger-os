import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveBuildRoot } from '../paths.mjs';

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const worktree = arg('--worktree');
const artifact = arg('--artifact');
const evidence = arg('--evidence');
const task = arg('--task', 'A-010');
const assigned = arg('--assigned-agent', 'cursor-local');

function run(cmd) {
  const r = spawnSync(cmd, {
    cwd: worktree,
    shell: true,
    encoding: 'utf8',
    timeout: 300000,
    env: { ...process.env, TEMP: path.join(resolveBuildRoot(), 'tmp'), TMP: path.join(resolveBuildRoot(), 'tmp') }
  });
  return {
    cmd,
    exitCode: r.status ?? 1,
    ok: (r.status ?? 1) === 0,
    stdoutTail: (r.stdout || '').slice(-2000),
    stderrTail: (r.stderr || '').slice(-2000)
  };
}

fs.mkdirSync(artifact, { recursive: true });
fs.mkdirSync(evidence, { recursive: true });

const existing = path.join(artifact, 'A-010-result.json');
let prior = null;
try {
  prior = JSON.parse(fs.readFileSync(existing, 'utf8'));
} catch {
  prior = null;
}

const foundation = run('npm run test:arranger-foundation');
const media = run('npm run test:arranger-media');
const ok = foundation.ok && media.ok;

const result = {
  ok,
  status: ok ? 'PASS' : 'FAIL',
  task,
  assignedAgent: assigned,
  completedAt: new Date().toISOString(),
  worktree,
  priorCommit: prior?.commit || null,
  tests: { foundation, media },
  integrated: false,
  note: ok
    ? 'A-010 media gate verified in task runner (rhythm migration + legal WAV playback)'
    : 'A-010 verification failed',
  firstBlocker: ok ? null : 'MEDIA_OR_FOUNDATION_FAIL'
};

const payload = `${JSON.stringify(result, null, 2)}\n`;
fs.writeFileSync(path.join(artifact, 'A-010-result.json'), payload);
fs.writeFileSync(path.join(evidence, 'A-010-result.json'), payload);
console.log(JSON.stringify({ status: result.status, task }));
process.exit(ok ? 0 : 1);
