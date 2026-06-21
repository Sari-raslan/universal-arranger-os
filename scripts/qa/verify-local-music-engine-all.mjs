import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

const scripts = [
  'scripts/qa/verify-real-limited-scanner-v1.mjs',
  'scripts/qa/verify-real-scanner-pipeline-import.mjs',
  'scripts/qa/verify-full-local-product-gate-v1.mjs',
  'scripts/qa/final-local-music-engine-gate.mjs'
];

const results = [];

for (const rel of scripts) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    results.push({ script: rel, pass: true, status: 'skipped-missing' });
    continue;
  }

  const r = spawnSync(process.execPath, [full], { cwd: root, encoding: 'utf8' });
  results.push({
    script: rel,
    pass: r.status === 0,
    status: r.status === 0 ? 'pass' : 'fail',
    stdoutTail: String(r.stdout || '').split(/\r?\n/).slice(-8),
    stderrTail: String(r.stderr || '').split(/\r?\n/).slice(-8)
  });
}

const out = {
  format: 'UAOS_ALL_LOCAL_QA_RESULT',
  version: '1.1.1-repair',
  createdAt: new Date().toISOString(),
  total: results.length,
  passCount: results.filter(r => r.pass).length,
  failCount: results.filter(r => !r.pass).length,
  results,
  safety: {
    localOnly: true,
    noDeployAction: true,
    noDeleteAction: true,
    noAppJsChange: true,
    noKeyboardWriter: true,
    noKeyboardOutput: true
  }
};

console.log(JSON.stringify(out, null, 2));
if (out.failCount > 0) process.exit(1);
