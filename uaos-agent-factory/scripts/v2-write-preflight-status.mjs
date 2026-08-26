#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v2-write-preflight-status.mjs <rundir>'); process.exit(1); }

const preflight = {
  windowsHost: 'Boss (MINGW64_NT-10.0-26200)',
  projectRoot: 'C:\\keyboard-manager-clean',
  programTree: 'C:\\keyboard-manager-clean\\uaos-program-tree',
  runtimeRoot: 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\program-tree',
  executionWorktrees: 'C:\\UAOS_AGENT_FACTORY_WORKTREES\\uaos-program-execution',
  artifactsRoot: 'C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\artifacts',
  allRootsExist: true,
  evidenceZipPath: 'C:/keyboard-manager-clean/uaos-agent-factory/.runtime/artifacts/uaos-program-tree/run-20260804-224922/UAOS-PROGRAM-TREE-EVIDENCE-20260804-224936.zip',
  evidenceZipExists: true,
  evidenceSha256Expected: '4BEB6462B728D44F1804090756630028096AF6A66F6EE5671E32A3C2700727EC',
  evidenceSha256Actual: '4BEB6462B728D44F1804090756630028096AF6A66F6EE5671E32A3C2700727EC',
  sha256Match: true,
  liveNodeProcessesDetected: 7,
  note: 'Multiple node.exe processes are currently running on this host. Could not confirm from the process list alone whether the UAOS factory supervisor/dispatcher is actively polling TASKS.json. Treating TASKS.json as potentially live shared state.',
};
fs.writeFileSync(runDir + '/PREFLIGHT.json', JSON.stringify(preflight, null, 2));

const takeover = {
  orchestrator: 'CLAUDE_CODE=PRIMARY_LEADER',
  missionAccepted: 'UAOS_PROGRAM_TREE_V2_CONTINUATION',
  scopeBoundary: 'uaos-program-tree only; Commander repository not opened/inspected/modified/tested per STRICT TOPIC BOUNDARY',
  startedAt: new Date().toISOString(),
  waveStatus: 'FIRST_EXECUTION_WAVE_A_THROUGH_D_COMPLETE_E_THROUGH_H_PENDING_OWNER_CONFIRMATION',
  reasonForPause: 'Full census (not just the requested 50-task sample) found ALL 1284 currently-DONE tasks are auto-generated marker-only stubs with zero real product implementation. Reopening ~1284/1604 tasks (80% of the graph) is a program-wide, high-blast-radius state change to a TASKS.json that may be read by a live running factory supervisor. Surfacing this finding for explicit confirmation before mutating shared central state.',
};
fs.writeFileSync(runDir + '/CLAUDE-TAKEOVER-STATUS.json', JSON.stringify(takeover, null, 2));
console.log('written preflight + takeover status');
