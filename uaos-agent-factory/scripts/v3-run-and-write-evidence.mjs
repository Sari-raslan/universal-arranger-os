#!/usr/bin/env node
// Runs a task's real test command, and writes a genuine evidence/result.json
// (real exit code, real stdout tail, real SHA256 of the owner file). No template values.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [, , taskId, worktree, ownerFileRel, testFileRel, extraNote] = process.argv;
if (!taskId || !worktree) {
  console.error('usage: node v3-run-and-write-evidence.mjs <taskId> <worktree> <ownerFileRel> <testFileRel> [note]');
  process.exit(1);
}

// Strip NODE_TEST_CONTEXT/NODE_TEST_WORKER_ID before spawning: if this script
// is ever itself invoked from inside a running `node --test` (directly or via
// a wrapper), those inherited vars make the child test runner silently no-op
// (exit 0, zero tests run) — a real false-positive discovered and fixed while
// implementing TASK-01-00068-ATOMIC_SAVE_EVIDENCE. Never trust a bare exit
// code alone; always confirm a non-zero real pass count.
const childEnv = { ...process.env };
delete childEnv.NODE_TEST_CONTEXT;
delete childEnv.NODE_TEST_WORKER_ID;

const testFile = path.join(worktree, testFileRel);
let status = 'PASS';
let exitCode = 0;
let stdout = '';
try {
  stdout = execFileSync('node', ['--test', testFile], { cwd: worktree, encoding: 'utf8', env: childEnv });
  const passMatch = /^ℹ pass (\d+)$/m.exec(stdout);
  const failMatch = /^ℹ fail (\d+)$/m.exec(stdout);
  if (!passMatch || !failMatch) {
    status = 'INDETERMINATE';
  } else if (Number(passMatch[1]) === 0) {
    status = 'INDETERMINATE';
  } else if (Number(failMatch[1]) > 0) {
    status = 'FAIL';
  }
} catch (err) {
  status = 'FAIL';
  exitCode = typeof err.status === 'number' ? err.status : 1;
  stdout = (err.stdout || '') + (err.stderr || '');
}

const ownerFile = path.join(worktree, ownerFileRel);
const ownerFileContent = fs.readFileSync(ownerFile);
const sha256 = crypto.createHash('sha256').update(ownerFileContent).digest('hex');

const evidence = {
  taskId,
  runAt: new Date().toISOString(),
  status,
  exitCode,
  testCommand: `node --test ${testFile}`,
  stdoutTail: stdout.split('\n').slice(-30).join('\n'),
  ownerFile,
  ownerFileSha256: sha256,
  ownerFileBytes: ownerFileContent.length,
  note: extraNote || undefined,
};

const evidenceDir = path.join(worktree, 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(path.join(evidenceDir, 'result.json'), JSON.stringify(evidence, null, 2));

console.log(JSON.stringify({ taskId, status, exitCode, sha256 }));
process.exit(status === 'PASS' ? 0 : 1);
