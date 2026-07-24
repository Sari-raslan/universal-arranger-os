import fs from 'node:fs';
import path from 'node:path';
import { FACTORY_ROOT, loadFactoryConfig, gitInfo, runCmd } from './lib.mjs';
import { resolveBuildRoot, resolveArtifactRoot, resolveWorktreeRoot } from './paths.mjs';

/**
 * Portable lane repository discovery. A "lane repository" is the real,
 * separate product git repo (Arranger/Library/Singy) that dispatched
 * writer work runs against - not Agent Factory scratch space, which is
 * already covered by src/paths.mjs.
 *
 * Resolution precedence, per lane:
 *   1. Explicit env var (UAOS_ARRANGER_REPO_ROOT / UAOS_LIBRARY_REPO_ROOT / UAOS_SINGY_REPO_ROOT)
 *   2. config/factory.local.json (gitignored, never committed)
 *   3. Discovery beneath UAOS_PRODUCT_REPO_SEARCH_ROOTS (path.delimiter-separated)
 *   4. The committed config/factory.json value, only if it is a non-null,
 *      genuinely-portable value (never trusted if it looks like a
 *      leftover owner-machine absolute path)
 *   5. LANE_REPOSITORY_NOT_CONFIGURED
 *
 * A missing or invalid repository blocks only that lane - it never makes
 * resolveLaneRepository/discoverLaneRepositories throw, so a caller can
 * always tell "lane N isn't configured" from "Agent Factory itself is broken".
 */

export const SUPPORTED_LANES = ['arranger', 'library', 'singy'];

const ENV_VAR_BY_LANE = {
  arranger: 'UAOS_ARRANGER_REPO_ROOT',
  library: 'UAOS_LIBRARY_REPO_ROOT',
  singy: 'UAOS_SINGY_REPO_ROOT'
};

const LANE_MARKER_FILE = '.uaos-lane';

export function envVarForLane(lane) {
  return ENV_VAR_BY_LANE[lane] || null;
}

function localOverridePath() {
  return path.join(FACTORY_ROOT, 'config', 'factory.local.json');
}

function readLocalOverride() {
  const p = localOverridePath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function searchRoots() {
  const raw = process.env.UAOS_PRODUCT_REPO_SEARCH_ROOTS;
  if (!raw) return [];
  const seen = new Set();
  const out = [];
  for (const p of raw.split(path.delimiter).map((s) => s.trim()).filter(Boolean).map((p) => path.resolve(p))) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/** True for values that are either unset or an obvious placeholder/owner leftover,
 * never for a value a caller genuinely configured. */
function isNeutralOrUnset(value) {
  if (!value) return true;
  if (typeof value !== 'string') return true;
  const v = value.trim();
  if (!v || v === '.' || v.toUpperCase().includes('REPLACE_ME') || v.toUpperCase().includes('CHANGE_ME')) return true;
  return false;
}

function forbiddenRootsForWorktrees() {
  return [
    resolveBuildRoot(),
    resolveArtifactRoot(),
    resolveWorktreeRoot(),
    path.join(FACTORY_ROOT, 'logs'),
    path.join(FACTORY_ROOT, 'state'),
    path.join(FACTORY_ROOT, '.runtime')
  ].map((p) => path.resolve(p).toLowerCase());
}

function isUnderAny(candidate, roots) {
  const c = path.resolve(candidate).toLowerCase();
  return roots.some((r) => c === r || c.startsWith(`${r}${path.sep}`));
}

/** Reads a repo's optional .uaos-lane marker file - "safe lane metadata"
 * rather than inferring the lane from the directory name. This is a plain,
 * unsigned text file: it stops accidental cross-lane mixups and disallows
 * a mismatch, but does not authenticate the repository's identity. That is
 * an accepted tradeoff for this single-user, local-machine trust model -
 * discovery only ever looks under directories the operator explicitly
 * configured via UAOS_PRODUCT_REPO_SEARCH_ROOTS. */
function readLaneMarker(repoPath) {
  const p = path.join(repoPath, LANE_MARKER_FILE);
  if (!fs.existsSync(p)) return null;
  try {
    return fs.readFileSync(p, 'utf8').trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Resolves a git-managed path (relative to repoPath) that is correct
 * whether repoPath is the main checkout or a linked worktree (.git file). */
function gitPath(repoPath, relative) {
  const r = runCmd(`git rev-parse --git-path ${relative}`, { cwd: repoPath });
  return r.ok ? path.resolve(repoPath, r.stdout.trim()) : null;
}

/**
 * Read-only validation. Never mutates the target repo. Returns
 * { ok, reason, ...diagnostics } - never throws.
 */
export function validateLaneRepository(repoPath, { lane, allowSelf = false } = {}) {
  if (!repoPath || typeof repoPath !== 'string') {
    return { ok: false, reason: 'NO_PATH' };
  }
  const resolved = path.resolve(repoPath);
  const lower = resolved.toLowerCase();

  if (lower === 'c:\\windows\\system32' || lower.startsWith('c:\\windows\\system32\\')) {
    return { ok: false, reason: 'FORBIDDEN_SYSTEM_PATH', path: resolved };
  }
  if (!allowSelf && resolved === path.resolve(FACTORY_ROOT)) {
    return { ok: false, reason: 'IS_AGENT_FACTORY_ITSELF', path: resolved };
  }
  if (isUnderAny(resolved, forbiddenRootsForWorktrees())) {
    return { ok: false, reason: 'IS_RUNTIME_OR_ARTIFACT_DIRECTORY', path: resolved };
  }
  if (!fs.existsSync(resolved)) {
    return { ok: false, reason: 'PATH_DOES_NOT_EXIST', path: resolved };
  }

  const info = gitInfo(resolved);
  if (!info.exists || !info.gitRoot) {
    return { ok: false, reason: 'NOT_A_GIT_REPOSITORY', path: resolved };
  }
  // Reject a path that resolves into a repo's tree without itself being
  // that repo's (or worktree's) own top-level - e.g. a subdirectory, or a
  // symlink whose target's git top-level lands somewhere unexpected.
  if (path.resolve(info.gitRoot).toLowerCase() !== lower) {
    return { ok: false, reason: 'PATH_IS_NOT_A_GIT_TOPLEVEL', path: resolved, gitRoot: info.gitRoot };
  }

  const bareCheck = runCmd('git rev-parse --is-bare-repository', { cwd: resolved });
  if (bareCheck.ok && bareCheck.stdout.trim() === 'true') {
    return { ok: false, reason: 'BARE_REPOSITORY_NOT_SUPPORTED', path: resolved };
  }

  const worktreeRoot = path.resolve(resolveWorktreeRoot()).toLowerCase();
  if (worktreeRoot === lower || worktreeRoot.startsWith(`${lower}${path.sep}`)) {
    return { ok: false, reason: 'WORKTREE_ROOT_NESTED_INSIDE_REPOSITORY', path: resolved, worktreeRoot };
  }

  const marker = readLaneMarker(resolved);
  if (lane && marker && marker !== lane) {
    return { ok: false, reason: 'LANE_MISMATCH', path: resolved, expectedLane: lane, markedLane: marker };
  }

  const mergeHead = gitPath(resolved, 'MERGE_HEAD');
  const rebaseMerge = gitPath(resolved, 'rebase-merge');
  const rebaseApply = gitPath(resolved, 'rebase-apply');
  const cherryPickHead = gitPath(resolved, 'CHERRY_PICK_HEAD');
  const bisectLog = gitPath(resolved, 'BISECT_LOG');
  const unresolvedOp = [mergeHead, rebaseMerge, rebaseApply, cherryPickHead, bisectLog].find(
    (p) => p && fs.existsSync(p)
  );
  if (unresolvedOp) {
    return { ok: false, reason: 'UNRESOLVED_GIT_OPERATION', path: resolved, evidence: unresolvedOp };
  }

  const indexLock = gitPath(resolved, 'index.lock');
  if (indexLock && fs.existsSync(indexLock)) {
    return { ok: false, reason: 'INDEX_LOCKED', path: resolved, evidence: indexLock };
  }

  return {
    ok: true,
    path: resolved,
    gitRoot: info.gitRoot,
    branch: info.branch,
    head: info.head,
    isDirty: info.isDirty,
    dirtyCount: info.dirtyCount,
    laneMarker: marker
  };
}

/** Search one level deep under each search root for a repo whose
 * .uaos-lane marker matches `lane`. Never infers a lane from a folder name. */
function discoverCandidates(lane) {
  const found = [];
  const seen = new Set();
  for (const root of searchRoots()) {
    if (!fs.existsSync(root)) continue;
    let entries;
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const candidate = path.join(root, ent.name);
      const marker = readLaneMarker(candidate);
      if (marker !== lane) continue;
      const key = path.resolve(candidate).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(candidate);
    }
  }
  return found;
}

/**
 * Resolve a single lane's repository. Never throws - a missing/invalid
 * repository blocks only this lane.
 */
export function resolveLaneRepository(lane, { validate = true } = {}) {
  if (!SUPPORTED_LANES.includes(lane)) {
    return { ok: false, reason: 'UNSUPPORTED_LANE', lane };
  }

  const sources = [];

  const envVar = envVarForLane(lane);
  const envValue = envVar ? process.env[envVar] : null;
  if (!isNeutralOrUnset(envValue)) sources.push({ source: 'env', envVar, value: envValue });

  const override = readLocalOverride();
  const overrideValue = override?.lanes?.[lane]?.repoRoot;
  if (!isNeutralOrUnset(overrideValue)) {
    sources.push({ source: 'localOverride', value: overrideValue, file: localOverridePath() });
  }

  // Ambiguity only matters at the precedence level actually being
  // consulted - a higher-precedence env var or local override must win
  // even if the discovery search roots happen to contain multiple matches.
  if (sources.length === 0) {
    const discovered = discoverCandidates(lane);
    if (discovered.length > 1) {
      return { ok: false, reason: 'AMBIGUOUS_REPOSITORY_MATCH', lane, candidates: discovered };
    }
    if (discovered.length === 1) sources.push({ source: 'discovery', value: discovered[0] });
  }

  let committedValue = null;
  try {
    committedValue = loadFactoryConfig()?.lanes?.[lane]?.repoRoot;
  } catch {
    committedValue = null;
  }
  if (!isNeutralOrUnset(committedValue)) sources.push({ source: 'committedConfig', value: committedValue });

  if (sources.length === 0) {
    return { ok: false, reason: 'LANE_REPOSITORY_NOT_CONFIGURED', lane };
  }

  const chosen = sources[0];
  if (!validate) {
    return { ok: true, lane, path: path.resolve(chosen.value), resolvedFrom: chosen.source };
  }

  const validation = validateLaneRepository(chosen.value, { lane });
  if (!validation.ok) {
    return { ok: false, reason: validation.reason, lane, resolvedFrom: chosen.source, ...validation };
  }
  return { ok: true, lane, resolvedFrom: chosen.source, ...validation };
}

export function discoverLaneRepositories(options = {}) {
  const out = {};
  for (const lane of SUPPORTED_LANES) {
    out[lane] = resolveLaneRepository(lane, options);
  }
  return out;
}

/** Rich, non-throwing diagnostic snapshot for a single lane - safe to
 * surface directly in `doctor`/dashboard output. */
export function getLaneRepositoryDiagnostics(lane) {
  const result = resolveLaneRepository(lane);
  return {
    lane,
    ok: result.ok,
    reason: result.ok ? null : result.reason,
    envVar: envVarForLane(lane),
    envVarSet: !isNeutralOrUnset(process.env[envVarForLane(lane)]),
    localOverridePresent: fs.existsSync(localOverridePath()),
    searchRootsConfigured: searchRoots().length,
    resolvedFrom: result.resolvedFrom || null,
    path: result.ok ? result.path : null,
    branch: result.ok ? result.branch : null,
    isDirty: result.ok ? result.isDirty : null
  };
}
