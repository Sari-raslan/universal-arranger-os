#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
const preStatusPath = process.argv[3];
if (!runDir || !preStatusPath) { console.error('usage: node v3-write-dirty-wip-preservation.mjs <rundir> <preStatusFile>'); process.exit(1); }
const raw = fs.readFileSync(preStatusPath, 'utf8');
const lines = raw.split('\n').map(l => l.trimEnd()).filter(Boolean);
const entries = lines.map(l => ({ raw: l, path: l.slice(3) }));
const out = {
  capturedAt: new Date().toISOString(),
  preExistingDirtyFileCount: entries.length,
  policy: 'None of these pre-existing modified/untracked files were edited, staged, or reverted by this session. Only new files under the task worktrees selected for this batch and TASKS.json/DEPENDENCIES.json (central graph state) were touched.',
  preExistingDirtyFiles: entries,
};
fs.writeFileSync(runDir + '/DIRTY-WIP-PRESERVATION.json', JSON.stringify(out, null, 2));
console.log('preExistingDirtyFileCount=', entries.length);
