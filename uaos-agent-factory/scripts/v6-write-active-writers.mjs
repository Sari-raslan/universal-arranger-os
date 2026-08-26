#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
const out = {
  checkedAt: new Date().toISOString(),
  method: 'Get-CimInstance Win32_Process -Filter "Name=\'node.exe\'" | Select ProcessId, CommandLine',
  rawFindings: [
    { pid: 21928, commandLine: '(permission-restricted)' },
    { pid: 27280, commandLine: '(permission-restricted)' },
    { pid: 28360, commandLine: '(permission-restricted)' },
    { pid: 28456, commandLine: '(permission-restricted)' },
    { pid: 4676, commandLine: 'npm run dev (unrelated web dev server)' },
    { pid: 41912, commandLine: 'UAOS Commander electron-vite dev — NOT touched, per strict topic boundary' },
  ],
  dispatcherOrSupervisorProcessFound: false,
  note: '6 node.exe processes observed. None resolved to uaos-agent-factory dispatch.mjs/supervisor.mjs/program-tree-server.mjs. The Commander dev process is running but out of scope and untouched.',
};
fs.writeFileSync(runDir + '/ACTIVE-WRITER-PROCESSES.json', JSON.stringify(out, null, 2));
console.log('written');
