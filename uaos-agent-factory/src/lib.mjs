import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync, execFileSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FACTORY_ROOT = path.resolve(__dirname, '..');
export const CONFIG_PATH = path.join(FACTORY_ROOT, 'config', 'factory.json');

/** No-pid (interactive) writers must heartbeat within this window to count as active. */
export const CURSOR_LOCAL_HEARTBEAT_STALE_MS = 30 * 60 * 1000;

/**
 * Synthetic/audit-fixture task IDs (e.g. L-SYN-DEP, used by cursor-local-claim.test.mjs as a
 * live claim/rebase sandbox) must never be treated as real production work — not dispatched
 * by the scheduler, not surfaced as "current task" in status reporting, not counted in
 * production task totals. Single source of truth for the ID convention already established by
 * generic-runner.mjs's synthetic-noop handling.
 */
export function isSyntheticTaskId(id) {
  const s = String(id || '');
  return (
    s.includes('-SYN-') ||
    /-SYN$/i.test(s) ||
    s.startsWith('L-SYN') ||
    s.startsWith('S-SYN') ||
    s.startsWith('A-SYN')
  );
}

/** Cache disk free reads so supervisor ticks never spam child processes. */
const DISK_FREE_CACHE = new Map();
const DISK_FREE_CACHE_MS = 30_000;

export function loadFactoryConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
  return p;
}

export function atomicWriteJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const bak = `${filePath}.bak`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeFileSync(fd, payload, 'utf8');
    try {
      fs.fsyncSync(fd);
    } catch {
      /* fsync may be unsupported on some volumes */
    }
  } finally {
    fs.closeSync(fd);
  }
  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, bak);
    } catch {
      /* best-effort backup */
    }
  }
  let lastErr;
  for (let i = 0; i < 8; i += 1) {
    try {
      fs.renameSync(tmp, filePath);
      return;
    } catch (err) {
      lastErr = err;
      if (err?.code !== 'EBUSY' && err?.code !== 'EPERM') break;
      const end = Date.now() + 20 * (i + 1);
      while (Date.now() < end) {
        /* brief backoff for Windows file lock */
      }
    }
  }
  try {
    fs.writeFileSync(filePath, payload, 'utf8');
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  } catch (err) {
    throw lastErr || err;
  }
}

/** Timing-safe string compare for CSRF / token checks. */
export function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

export function nowIso() {
  return new Date().toISOString();
}

export function freeRamGb() {
  const free = os.freemem() / (1024 ** 3);
  const total = os.totalmem() / (1024 ** 3);
  return { freeGb: Number(free.toFixed(2)), totalGb: Number(total.toFixed(2)) };
}

/**
 * Free disk space in GB. Prefer Node fs.statfsSync (no child process).
 * Fallback PowerShell uses execFile + windowsHide + shell:false — never a visible console.
 */
export function freeDiskGb(driveLetter, { bypassCache = false } = {}) {
  const key = String(driveLetter || '')
    .replace(/:$/, '')
    .toUpperCase();
  // Single letter only - key is interpolated into a PowerShell -Command
  // string below, so anything else must be rejected rather than passed through.
  if (!/^[A-Z]$/.test(key)) return null;
  const cached = DISK_FREE_CACHE.get(key);
  if (!bypassCache && cached && Date.now() - cached.at < DISK_FREE_CACHE_MS) {
    return cached.value;
  }

  let value = null;
  try {
    if (typeof fs.statfsSync === 'function') {
      const root = process.platform === 'win32' ? `${key}:\\` : '/';
      const s = fs.statfsSync(root);
      value = Number(((Number(s.bavail) * Number(s.bsize)) / 1024 ** 3).toFixed(2));
    }
  } catch {
    value = null;
  }

  if (value == null && process.platform === 'win32') {
    const fallbackRoots = [
      `${key}:\\`,
      process.cwd(),
      FACTORY_ROOT,
      path.join(FACTORY_ROOT, 'state')
    ];

    for (const root of fallbackRoots) {
      try {
        const s = fs.statSync(root);
        if (s && s.isDirectory()) {
          const directory = fs.statfsSync ? fs.statfsSync(root) : null;
          if (directory) {
            value = Number(((Number(directory.bavail) * Number(directory.bsize)) / 1024 ** 3).toFixed(2));
            break;
          }
        }
      } catch {
        // ignore and continue to next fallback root
      }
    }
  }

  if (value == null) {
    try {
      const out = execFileSync(
        'powershell.exe',
        [
          '-NoLogo',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-Command',
          `(Get-PSDrive ${key} -ErrorAction Stop).Free`
        ],
        {
          encoding: 'utf8',
          timeout: 15000,
          windowsHide: true,
          shell: false
        }
      ).trim();
      // A drive PowerShell can't find prints its error to stderr but may
      // still exit 0 with empty stdout - Number('') is 0, not NaN, so an
      // absent drive must be checked explicitly rather than trusted as free space.
      const parsed = out === '' ? NaN : Number(out);
      value = Number.isFinite(parsed) ? Number((parsed / 1024 ** 3).toFixed(2)) : null;
    } catch {
      value = null;
    }
  }

  DISK_FREE_CACHE.set(key, { at: Date.now(), value });
  return value;
}

/** Exported for tests — default hidden spawn options for factory children. */
export function hiddenSpawnOptions(stdio) {
  return {
    detached: true,
    stdio,
    windowsHide: true,
    shell: false
  };
}

export function runCmd(command, opts = {}) {
  const { cwd = FACTORY_ROOT, timeout = 120000 } = opts;
  try {
    const stdout = execSync(command, {
      cwd,
      encoding: 'utf8',
      timeout,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });
    return { ok: true, exitCode: 0, stdout: stdout || '', stderr: '' };
  } catch (err) {
    return {
      ok: false,
      exitCode: typeof err.status === 'number' ? err.status : 1,
      stdout: err.stdout?.toString?.() || '',
      stderr: err.stderr?.toString?.() || String(err.message || err)
    };
  }
}

export function gitInfo(repoRoot) {
  if (!fs.existsSync(repoRoot)) {
    return { exists: false, repoRoot };
  }
  const top = runCmd('git rev-parse --show-toplevel', { cwd: repoRoot });
  const branch = runCmd('git branch --show-current', { cwd: repoRoot });
  const head = runCmd('git rev-parse HEAD', { cwd: repoRoot });
  const status = runCmd('git status --porcelain', { cwd: repoRoot });
  const dirtyLines = (status.stdout || '').split(/\r?\n/).filter(Boolean);
  return {
    exists: true,
    repoRoot,
    gitRoot: (top.stdout || '').trim(),
    branch: (branch.stdout || '').trim(),
    head: (head.stdout || '').trim(),
    dirtyCount: dirtyLines.length,
    dirtySample: dirtyLines.slice(0, 40),
    isDirty: dirtyLines.length > 0
  };
}

export function listFilesRecursive(root, { max = 200, filter } = {}) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  const stack = [root];
  while (stack.length && out.length < max) {
    const cur = stack.pop();
    let ents;
    try {
      ents = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of ents) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (!filter || filter(full)) out.push(full);
    }
  }
  return out;
}

/** Walk upward from startDir to find the nearest enclosing git repository root
 * (the first directory containing a .git entry) - portable replacement for
 * assuming FACTORY_ROOT's parent is always the enclosing repo's own root. */
export function findGitRoot(startDir = FACTORY_ROOT) {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function spawnDetached(command, args, { cwd, logFile, pidFile } = {}) {
  ensureDir(path.dirname(logFile));
  ensureDir(path.dirname(pidFile));
  const out = fs.openSync(logFile, 'a');
  const child = spawn(command, args, {
    cwd,
    ...hiddenSpawnOptions(['ignore', out, out])
  });
  child.unref();
  atomicWriteJson(pidFile, {
    pid: child.pid,
    startedAt: nowIso(),
    command,
    args,
    logFile
  });
  return child.pid;
}

export function isPidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function containsForbiddenCommand(text) {
  const cfg = loadFactoryConfig();
  const lower = String(text || '').toLowerCase();
  return cfg.forbiddenCommands.filter((c) => lower.includes(c.toLowerCase()));
}

export function pathLeakScan(text) {
  const hits = [];
  const re = /C:\\Users\\ssare/gi;
  if (re.test(String(text || ''))) hits.push('C:\\Users\\ssare');
  return hits;
}
