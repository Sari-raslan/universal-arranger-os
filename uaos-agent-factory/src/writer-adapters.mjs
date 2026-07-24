import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import {
  FACTORY_ROOT,
  ensureDir,
  atomicWriteJson,
  readJson,
  nowIso,
  isPidAlive,
  runCmd,
  hiddenSpawnOptions
} from './lib.mjs';
import { listAgents } from './agent-adapters.mjs';
import { resolveBuildRoot, resolveWorktreeRoot } from './paths.mjs';

const REGISTRY = path.join(FACTORY_ROOT, 'config', 'agents.runtime.json');

/** Models known to work with codex-cli 0.134.x when user config forces unsupported gpt-5.6-sol */
export const CODEX_COMPAT_MODEL = 'gpt-4.1';

export function loadRuntimeAgents() {
  return readJson(REGISTRY, { updatedAt: null, agents: {} });
}

export function saveRuntimeAgents(data) {
  data.updatedAt = nowIso();
  atomicWriteJson(REGISTRY, data);
  return data;
}

export function markAgentRuntime(agentId, patch) {
  const reg = loadRuntimeAgents();
  reg.agents[agentId] = { ...(reg.agents[agentId] || {}), ...patch, updatedAt: nowIso() };
  saveRuntimeAgents(reg);
  return reg.agents[agentId];
}

export function isWriterAvailable(agentId) {
  const reg = loadRuntimeAgents();
  const a = reg.agents[agentId];
  if (!a) return false;
  return a.smokePass === true && a.availableForWriters !== false;
}

/**
 * Build Codex exec argv using installed CLI help semantics.
 * Always override broken user-config model gpt-5.6-sol on CLI 0.134.
 */
export function buildCodexExecArgs({ cwd, promptMode = 'stdin' } = {}) {
  const args = [
    'exec',
    '--skip-git-repo-check',
    '-C',
    cwd,
    '-c',
    `model="${CODEX_COMPAT_MODEL}"`,
    '-s',
    'workspace-write'
  ];
  if (promptMode === 'stdin') args.push('-');
  return args;
}

export function spawnWriterProcess({
  agentId,
  cwd,
  prompt,
  logFile,
  env = {},
  localRunner = null,
  localArgs = []
}) {
  ensureDir(path.dirname(logFile));
  const out = fs.openSync(logFile, 'a');
  let command;
  let args;

  if (localRunner) {
    command = process.execPath;
    args = [localRunner, ...localArgs];
  } else if (agentId === 'codex') {
    command = 'codex';
    args = buildCodexExecArgs({ cwd, promptMode: 'stdin' });
  } else if (agentId === 'claude') {
    command = 'claude';
    args = ['-p', prompt, '--output-format', 'text', '--permission-mode', 'acceptEdits'];
  } else if (agentId === 'gemini') {
    command = 'gemini';
    args = ['-p', prompt, '-y'];
  } else if (agentId === 'cursor-local') {
    throw new Error('cursor-local requires localRunner path');
  } else {
    throw new Error(`Unsupported writer agent: ${agentId}`);
  }

  const child = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      ...env,
      TEMP: env.TEMP || path.join(resolveBuildRoot(), 'tmp'),
      TMP: env.TMP || path.join(resolveBuildRoot(), 'tmp')
    },
    ...hiddenSpawnOptions(agentId === 'codex' && !localRunner ? ['pipe', out, out] : ['ignore', out, out])
  });

  if (agentId === 'codex' && !localRunner && child.stdin) {
    child.stdin.write(prompt || '');
    child.stdin.end();
  }

  child.unref();
  return {
    pid: child.pid,
    command,
    args,
    logFile,
    agentId,
    startedAt: nowIso()
  };
}

export function preferredWriterForLane(lane) {
  const order =
    lane === 'singy'
      ? ['codex', 'claude', 'cursor-local']
      : lane === 'arranger'
        ? ['codex', 'claude', 'cursor-local']
        : ['codex', 'gemini', 'cursor-local'];
  for (const id of order) {
    if (id === 'cursor-local') return id;
    if (isWriterAvailable(id)) return id;
  }
  return 'cursor-local';
}

export function recordSmokeResult(agentId, { ok, exitCode, note, evidence, commandMode }) {
  return markAgentRuntime(agentId, {
    smokePass: !!ok,
    availableForWriters: !!ok,
    lastSmokeExitCode: exitCode ?? null,
    lastSmokeNote: note || '',
    evidence: evidence || null,
    commandMode: commandMode || null
  });
}

export function probeVersion(agentId) {
  const map = {
    codex: 'codex --version',
    claude: 'claude --version',
    gemini: 'gemini --version',
    ollama: 'ollama --version'
  };
  const cmd = map[agentId];
  if (!cmd) return { ok: false };
  return runCmd(cmd, { timeout: 20000 });
}

export function smokeRoot() {
  return path.join(resolveWorktreeRoot(), 'adapter-smoke');
}

export function summarizeDetectedAgents() {
  return listAgents().map((a) => ({
    id: a.id,
    available: a.available,
    roles: a.assignedRoles || []
  }));
}
