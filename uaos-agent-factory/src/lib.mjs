import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FACTORY_ROOT = path.resolve(__dirname, '..');
export const CONFIG_PATH = path.join(FACTORY_ROOT, 'config', 'factory.json');

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
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(tmp, payload, 'utf8');
  fs.renameSync(tmp, filePath);
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

export function freeDiskGb(driveLetter) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(
        `powershell -NoProfile -Command "(Get-PSDrive ${driveLetter}).Free"`,
        { encoding: 'utf8', timeout: 15000 }
      ).trim();
      return Number((Number(out) / (1024 ** 3)).toFixed(2));
    }
  } catch {
    return null;
  }
  return null;
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

export function spawnDetached(command, args, { cwd, logFile, pidFile } = {}) {
  ensureDir(path.dirname(logFile));
  ensureDir(path.dirname(pidFile));
  const out = fs.openSync(logFile, 'a');
  const child = spawn(command, args, {
    cwd,
    detached: true,
    stdio: ['ignore', out, out],
    windowsHide: true
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
