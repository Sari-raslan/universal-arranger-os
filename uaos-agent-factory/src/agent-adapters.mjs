import fs from 'node:fs';
import path from 'node:path';
import { FACTORY_ROOT, readJson, runCmd, nowIso } from './lib.mjs';

const agents = readJson(path.join(FACTORY_ROOT, 'config', 'agents.detected.json'), { agents: [] });

export function listAgents() {
  return agents.agents || [];
}

export function availableAgents() {
  return listAgents().filter((a) => a.available);
}

export function unavailableAgents() {
  return listAgents().filter((a) => !a.available);
}

export function agentsByRole(role) {
  return availableAgents().filter((a) => (a.assignedRoles || []).includes(role));
}

/**
 * Headless agent invocation is optional and non-blocking.
 * For recovery/deterministic tasks the supervisor runs Node handlers directly.
 * External agents are reserved for future writer/scout slots when RAM allows.
 */
export function probeAgent(agentId) {
  const agent = listAgents().find((a) => a.id === agentId);
  if (!agent || !agent.available || !agent.command) {
    return { ok: false, reason: 'unavailable', agentId };
  }
  const r = runCmd(`${agent.command} --version`, { timeout: 20000 });
  return {
    ok: r.ok,
    agentId,
    versionStdout: (r.stdout || r.stderr || '').trim().slice(0, 200),
    probedAt: nowIso()
  };
}

export function writeScoutStub({ lane, taskId, rootCause, files, plan }) {
  return {
    role: 'SCOUT',
    lane,
    taskId,
    createdAt: nowIso(),
    rootCause,
    exactFiles: files || [],
    smallestChange: plan || '',
    risks: [],
    testCommands: [],
    sourceMutated: false
  };
}
