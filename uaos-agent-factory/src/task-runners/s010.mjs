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
const task = arg('--task', 'S-010');
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
    stdoutTail: (r.stdout || '').slice(-2500),
    stderrTail: (r.stderr || '').slice(-2500)
  };
}

function scanLeaks(root) {
  const hits = [];
  const skip = new Set(['node_modules', '.git', 'dist', 'release', '.uaos-work']);
  const stack = [root];
  while (stack.length && hits.length < 50) {
    const cur = stack.pop();
    let ents;
    try {
      ents = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of ents) {
      if (skip.has(ent.name)) continue;
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (/\.(cjs|mjs|js|jsx|ts|tsx|json)$/i.test(ent.name)) {
        let text = '';
        try {
          text = fs.readFileSync(full, 'utf8');
        } catch {
          continue;
        }
        if (/[A-Za-z]:\\Users\\[^\\]+/i.test(text) || /owner-project-musical-fix/i.test(text)) {
          hits.push(full);
        }
      }
    }
  }
  return hits;
}

fs.mkdirSync(artifact, { recursive: true });
fs.mkdirSync(evidence, { recursive: true });

const pkg = JSON.parse(fs.readFileSync(path.join(worktree, 'package.json'), 'utf8'));
const hasScript = Boolean(pkg.scripts?.['test:singy-s010'] || pkg.scripts?.['test:s010']);
const testCmd = pkg.scripts?.['test:singy-s010']
  ? 'npm run test:singy-s010'
  : pkg.scripts?.['test:s010']
    ? 'npm run test:s010'
    : fs.existsSync(path.join(worktree, 'tests', 'singy-s010-first-run.test.cjs'))
      ? 'node tests/singy-s010-first-run.test.cjs'
      : null;

const test = testCmd ? run(testCmd) : { ok: false, exitCode: 1, cmd: null, stderrTail: 'NO_S010_TEST' };
const leaks = scanLeaks(path.join(worktree, 'apps'));
const ok = test.ok && leaks.length === 0;

const result = {
  ok,
  status: ok ? 'PASS' : 'FAIL',
  task,
  assignedAgent: assigned,
  completedAt: new Date().toISOString(),
  worktree,
  test,
  pathLeakHits: leaks,
  hasScript,
  integrated: false,
  firstBlocker: ok ? null : test.ok ? 'PATH_LEAKS' : 'S010_TESTS_FAIL_OR_MISSING',
  note: ok
    ? 'S-010 first-run tests PASS; no owner path leaks in apps/'
    : 'S-010 incomplete — see test/pathLeakHits'
};

const payload = `${JSON.stringify(result, null, 2)}\n`;
fs.writeFileSync(path.join(artifact, 'S-010-result.json'), payload);
fs.writeFileSync(path.join(evidence, 'S-010-result.json'), payload);
console.log(JSON.stringify({ status: result.status, task, leaks: leaks.length }));
process.exit(ok ? 0 : 1);
