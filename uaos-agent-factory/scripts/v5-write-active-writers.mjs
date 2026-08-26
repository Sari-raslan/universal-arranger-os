#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
const psOutput = process.argv[3];
const out = {
  checkedAt: new Date().toISOString(),
  method: 'Get-CimInstance Win32_Process -Filter "Name=\'node.exe\'" | Select ProcessId, CommandLine',
  rawFindings: psOutput,
  dispatcherOrSupervisorProcessFound: false,
  note: '4 node.exe processes observed, all with empty/permission-restricted CommandLine. None resolved to a recognizable uaos-agent-factory dispatch.mjs/supervisor.mjs/program-tree-server.mjs command line (unlike Batch 1, where the dashboard server was visible). Treated as: no confirmed live writer against TASKS.json, but proceeding with the same care as if one might exist (small write, verify-then-write pattern, no long-held file locks).',
};
fs.writeFileSync(runDir + '/ACTIVE-WRITER-PROCESSES.json', JSON.stringify(out, null, 2));
console.log('written');
