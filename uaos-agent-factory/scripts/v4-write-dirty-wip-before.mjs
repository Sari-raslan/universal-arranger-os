#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
const preStatusPath = process.argv[3];
const raw = fs.readFileSync(preStatusPath, 'utf8');
const lines = raw.split('\n').map(l => l.trimEnd()).filter(Boolean);
const entries = lines.map(l => ({ raw: l, path: l.slice(3) }));
fs.writeFileSync(runDir + '/DIRTY-WIP-BEFORE.json', JSON.stringify({
  capturedAt: new Date().toISOString(),
  preExistingDirtyFileCount: entries.length,
  policy: 'None of these were edited by this batch. Only the newly-selected task worktrees, TASKS.json, and this run\'s own artifact directory were touched.',
  preExistingDirtyFiles: entries,
}, null, 2));
console.log('preExistingDirtyFileCount=', entries.length);
