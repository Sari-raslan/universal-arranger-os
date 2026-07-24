import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Disposable, real git repositories for lane-repository tests. Each fixture
 * is created under the OS temp dir (never inside this checkout), gets a
 * test-only local git identity (global git config is never touched), an
 * initial commit, the lane's integration branch, and a .uaos-lane marker
 * file so src/lane-repositories.mjs's "safe lane metadata" check has
 * something real to read.
 */

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim();
}

const created = [];

export function createLaneRepoFixture(lane, { integrationBranch, laneMarker = lane, dirPrefix = '' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `uaos-lane-${lane}-${dirPrefix}`));
  created.push(root);

  git(root, ['init', '--quiet']);
  git(root, ['config', 'user.email', 'uaos-factory-test@local']);
  git(root, ['config', 'user.name', 'UAOS Factory Test']);
  git(root, ['config', 'commit.gpgsign', 'false']);

  if (laneMarker !== null) {
    fs.writeFileSync(path.join(root, '.uaos-lane'), laneMarker, 'utf8');
  }
  fs.writeFileSync(path.join(root, 'README.md'), `# ${lane} fixture\n`, 'utf8');
  fs.writeFileSync(path.join(root, 'PROJECT_STATE.md'), `# ${lane} state\n\nfixture only\n`, 'utf8');
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: `uaos-${lane}-fixture`, version: '0.0.0', scripts: {} }, null, 2),
    'utf8'
  );
  const toAdd = ['README.md', 'PROJECT_STATE.md', 'package.json'];
  if (laneMarker !== null) toAdd.unshift('.uaos-lane');
  git(root, ['add', ...toAdd]);
  git(root, ['commit', '--quiet', '-m', 'initial commit']);

  const branch = integrationBranch || `factory/${lane}-integration`;
  git(root, ['branch', branch]);

  return {
    lane,
    root,
    integrationBranch: branch,
    headSha: git(root, ['rev-parse', 'HEAD']),
    revParse(ref = 'HEAD') {
      return git(root, ['rev-parse', ref]);
    },
    branchExists(name) {
      try {
        git(root, ['show-ref', '--verify', '--quiet', `refs/heads/${name}`]);
        return true;
      } catch {
        return false;
      }
    },
    commitFile(relativePath, content, message) {
      const target = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content, 'utf8');
      git(root, ['add', relativePath]);
      git(root, ['commit', '--quiet', '-m', message || `update ${relativePath}`]);
      return git(root, ['rev-parse', 'HEAD']);
    },
    makeDirty(relativePath = 'DIRTY.txt', content = 'uncommitted\n') {
      fs.writeFileSync(path.join(root, relativePath), content, 'utf8');
    },
    writeIndexLock() {
      fs.writeFileSync(path.join(root, '.git', 'index.lock'), '', 'utf8');
    },
    removeIndexLock() {
      const p = path.join(root, '.git', 'index.lock');
      if (fs.existsSync(p)) fs.rmSync(p);
    },
    beginUnmergedRebase(otherBranchWithConflict) {
      // Cheap way to leave .git/rebase-merge behind without needing a real
      // conflict: start a rebase onto a divergent branch, which halts on
      // the first conflicting commit.
      try {
        git(root, ['rebase', otherBranchWithConflict]);
      } catch {
        /* expected - rebase stops with a conflict, leaving .git/rebase-merge */
      }
    },
    abortRebase() {
      try {
        git(root, ['rebase', '--abort']);
      } catch {
        /* ignore - nothing to abort */
      }
    }
  };
}

/** Deliberately invalid "repository" - a plain directory with no .git at all. */
export function createNonGitFixture(prefix = 'uaos-lane-notgit-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  created.push(root);
  fs.writeFileSync(path.join(root, 'README.md'), 'not a git repo\n', 'utf8');
  return root;
}

export function cleanupLaneRepoFixtures() {
  while (created.length) {
    const dir = created.pop();
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best-effort - a locked handle on Windows should not fail the suite */
    }
  }
}
