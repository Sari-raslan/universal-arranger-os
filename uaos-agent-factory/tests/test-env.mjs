import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Import this FIRST in every test file, before any '../src/*.mjs' import.
 * ESM evaluates imports in the order they appear, each running fully
 * (including its own top-level code) before the next import starts - so
 * as long as this stays the first import, UAOS_FACTORY_ROOT is set before
 * src/lib.mjs computes its module-load-time FACTORY_ROOT constant.
 *
 * Redirects the factory root to a fresh temp directory seeded with copies
 * of config/ and queues/ from the real checkout, so tests read the same
 * fixture data production does but can never write back into the real
 * repo. node --test runs each matched file in its own subprocess, so this
 * env var never leaks between test files.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REAL_FACTORY_ROOT = path.resolve(__dirname, '..');
export const TEST_FACTORY_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-factory-test-'));

for (const dir of ['config', 'queues', 'state', 'logs']) {
  fs.mkdirSync(path.join(TEST_FACTORY_ROOT, dir), { recursive: true });
}
fs.copyFileSync(
  path.join(REAL_FACTORY_ROOT, 'config', 'factory.json'),
  path.join(TEST_FACTORY_ROOT, 'config', 'factory.json')
);
for (const f of fs.readdirSync(path.join(REAL_FACTORY_ROOT, 'queues'))) {
  if (f.endsWith('.queue.json')) {
    fs.copyFileSync(path.join(REAL_FACTORY_ROOT, 'queues', f), path.join(TEST_FACTORY_ROOT, 'queues', f));
  }
}

process.env.UAOS_FACTORY_ROOT = TEST_FACTORY_ROOT;
// FACTORY_ROOT alone only redirects config/queues/state/logs (paths built directly from the
// constant). worktreeRoot/artifactRoot/buildCacheRoot are read from the copied factory.json,
// which still has this checkout's real machine-specific values — so without also overriding
// these, resolveWorktreeRoot()/resolveArtifactRoot()/resolveBuildRoot() (paths.mjs) fall through
// to the real, shared C:\UAOS_AGENT_FACTORY_WORKTREES\ etc. A test creating a real git worktree
// there (e.g. three-lane-acceptance.test.mjs) would pollute shared infrastructure even though
// the repo it links to is disposable.
for (const dir of ['worktrees', 'artifacts', 'build']) {
  fs.mkdirSync(path.join(TEST_FACTORY_ROOT, dir), { recursive: true });
}
process.env.UAOS_FACTORY_WORKTREE_ROOT = path.join(TEST_FACTORY_ROOT, 'worktrees');
process.env.UAOS_FACTORY_ARTIFACT_ROOT = path.join(TEST_FACTORY_ROOT, 'artifacts');
process.env.UAOS_FACTORY_BUILD_ROOT = path.join(TEST_FACTORY_ROOT, 'build');
// Defensive isolation: a developer's shell setting this for their own
// local lane-repository discovery must never leak into lane-repository
// tests that don't explicitly set it themselves.
delete process.env.UAOS_PRODUCT_REPO_SEARCH_ROOTS;

/** Register with node:test's `after()` so the temp root and every writer
 * process/child it might contain are cleaned up when the file finishes. */
export function cleanupIsolatedFactoryRoot() {
  try {
    fs.rmSync(TEST_FACTORY_ROOT, { recursive: true, force: true });
  } catch {
    /* best-effort - a locked handle on Windows should not fail the suite */
  }
}
