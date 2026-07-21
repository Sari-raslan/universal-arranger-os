import fs from 'node:fs';
import path from 'node:path';
import {
  FACTORY_ROOT,
  ensureDir,
  atomicWriteJson,
  nowIso,
  runCmd,
  sha256File
} from './lib.mjs';
import { assertSafeCommands } from './security-guard.mjs';

export function runCommandList(commands, { cwd, evidenceDir, label = 'cmd' } = {}) {
  assertSafeCommands(commands);
  ensureDir(evidenceDir);
  const results = [];
  for (let i = 0; i < commands.length; i += 1) {
    const cmd = commands[i];
    const started = nowIso();
    const res = runCmd(cmd, { cwd, timeout: 300000 });
    const entry = {
      index: i,
      command: cmd,
      startedAt: started,
      endedAt: nowIso(),
      exitCode: res.exitCode,
      ok: res.ok,
      stdoutTail: (res.stdout || '').slice(-4000),
      stderrTail: (res.stderr || '').slice(-4000)
    };
    const logPath = path.join(evidenceDir, `${label}-${i}.json`);
    atomicWriteJson(logPath, entry);
    results.push({ ...entry, logPath });
    if (!res.ok) break;
  }
  return results;
}

export function hashArtifacts(paths) {
  return paths
    .filter((p) => fs.existsSync(p))
    .map((p) => ({ path: p, sha256: sha256File(p), bytes: fs.statSync(p).size }));
}

export function zipIntegrityCheck(zipPath) {
  if (!fs.existsSync(zipPath)) return { ok: false, reason: 'missing' };
  // Lightweight: file exists + non-zero + sha256
  const st = fs.statSync(zipPath);
  return {
    ok: st.size > 0,
    bytes: st.size,
    sha256: sha256File(zipPath),
    note: 'header_presence_only_not_full_unzip'
  };
}

export { FACTORY_ROOT };
