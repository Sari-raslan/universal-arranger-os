// Local, uncommitted bootstrap: probes real CLIs on this machine and records
// genuine results into config/agents.runtime.json + config/agents.detected.json,
// using the exact schema src/writer-adapters.mjs and src/agent-adapters.mjs expect.
// Nothing here is fabricated - recordSmokeResult only marks smokePass true when
// the real subprocess actually exited 0.
import path from 'node:path';
import { probeVersion, recordSmokeResult } from '../src/writer-adapters.mjs';
import { FACTORY_ROOT, atomicWriteJson } from '../src/lib.mjs';

const CANDIDATES = [
  { id: 'codex', command: 'codex', roles: ['WRITER'] },
  { id: 'claude', command: 'claude', roles: ['WRITER', 'REVIEWER'] },
  { id: 'gemini', command: 'gemini', roles: ['WRITER'] },
  { id: 'ollama', command: 'ollama', roles: ['SCOUT'] }
];

const detected = [];
for (const c of CANDIDATES) {
  const probe = probeVersion(c.id);
  console.log(`${c.id}: ok=${probe.ok} -> ${(probe.stdout || probe.stderr || '').trim().slice(0, 80)}`);
  recordSmokeResult(c.id, {
    ok: probe.ok,
    exitCode: probe.exitCode ?? null,
    note: probe.ok ? 'version probe succeeded' : 'version probe failed',
    evidence: (probe.stdout || probe.stderr || '').trim().slice(0, 200),
    commandMode: 'version-probe'
  });
  detected.push({
    id: c.id,
    available: !!probe.ok,
    command: c.command,
    assignedRoles: c.roles
  });
}

atomicWriteJson(path.join(FACTORY_ROOT, 'config', 'agents.detected.json'), { agents: detected });
console.log('\nWrote config/agents.runtime.json and config/agents.detected.json');
