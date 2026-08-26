#!/usr/bin/env node
// Generates a standard evidence-aggregator src file + test file for a 4-task chain,
// following the pattern established and hardened across Batches 1-4.
import fs from 'node:fs';

const [, , configPath] = process.argv;
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
// cfg: { evidenceTaskId, featureName, srcOutPath, testOutPath, worktreesRootUp, rollbackProcedureLines: string[], featureFiles: [{taskId,dir,src,test}] }

const featureFilesLiteral = JSON.stringify(cfg.featureFiles, null, 2);
const rollbackText = cfg.rollbackProcedureLines.join('\n');

const src = `// Evidence aggregator for the ${cfg.featureName} feature.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKTREES_ROOT = path.resolve(__dirname, ${cfg.worktreesRootUp.map(() => "'..'").join(', ')});

export const ROLLBACK_RECOVERY_PROCEDURE = \`${cfg.featureName} — rollback/recovery procedure

${rollbackText}\`;

const FEATURE_FILES = ${featureFilesLiteral};

function childEnv() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  delete env.NODE_TEST_WORKER_ID;
  return env;
}
function parseNodeTestSummary(stdout) {
  const pass = /^ℹ pass (\\d+)$/m.exec(stdout);
  const fail = /^ℹ fail (\\d+)$/m.exec(stdout);
  const skipped = /^ℹ skipped (\\d+)$/m.exec(stdout);
  if (!pass || !fail) return null;
  return { pass: Number(pass[1]), fail: Number(fail[1]), skipped: skipped ? Number(skipped[1]) : 0 };
}
function summaryTail(text) {
  const lines = text.split('\\n').filter(l => /^[ℹ✔✖﹣]/.test(l.trim()));
  return lines.length ? lines.join('\\n') : text.split('\\n').filter(Boolean).slice(-8).join('\\n');
}
export function runNodeTestFile(cwd, testPath) {
  let sourceTestCallCount = 0;
  try {
    const src = fs.readFileSync(testPath, 'utf8');
    sourceTestCallCount = (src.match(/\\b(?:test|it)\\s*\\(\\s*['"\`]/g) || []).length;
  } catch { /* execFileSync below will surface the real error */ }
  if (sourceTestCallCount === 0) return { status: 'FAIL', reason: 'test file contains zero real test()/it() call sites', testTail: '' };

  let stdout = '';
  try {
    stdout = execFileSync('node', ['--test', testPath], { cwd, encoding: 'utf8', env: childEnv() });
  } catch (err) {
    const combined = (err.stdout || '') + (err.stderr || '');
    const summary = parseNodeTestSummary(combined);
    return { status: 'FAIL', reason: summary ? \`\${summary.fail} of \${summary.pass + summary.fail} tests failed\` : 'child test process exited non-zero with no parseable summary', testTail: summaryTail(combined) };
  }
  const summary = parseNodeTestSummary(stdout);
  const testTail = summaryTail(stdout);
  if (!summary) return { status: 'FAIL', reason: 'child process exited 0 but produced no parseable node:test summary', testTail };
  if (summary.fail > 0) return { status: 'FAIL', reason: \`\${summary.fail} of \${summary.pass + summary.fail} tests failed\`, testTail };
  if (summary.pass + summary.skipped < sourceTestCallCount) return { status: 'FAIL', reason: \`source has \${sourceTestCallCount} test() sites but only \${summary.pass} passed + \${summary.skipped} skipped\`, testTail };
  return { status: 'PASS', reason: undefined, testsDiscovered: summary.pass, sourceTestCallCount, testTail };
}

export function collectFeatureEvidence() {
  const results = FEATURE_FILES.map(f => {
    const dir = path.join(WORKTREES_ROOT, f.dir);
    const srcPath = path.join(dir, f.src);
    const testPath = path.join(dir, f.test);
    const outcome = runNodeTestFile(dir, testPath);
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(srcPath)).digest('hex');
    return { taskId: f.taskId, ...outcome, sha256 };
  });
  return { feature: '${cfg.featureName}', allPassed: results.every(r => r.status === 'PASS'), results };
}

export function verify() {
  const evidence = collectFeatureEvidence();
  return { ok: evidence.allPassed, taskId: '${cfg.evidenceTaskId}', feature: evidence.feature };
}

import { pathToFileURL } from 'node:url';
const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) console.log(JSON.stringify(verify()));
`;

fs.writeFileSync(cfg.srcOutPath, src);
console.log('written', cfg.srcOutPath);
