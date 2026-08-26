#!/usr/bin/env node
// UAOS Program Tree V2 — stratified sample of DONE tasks across all domains + evidence existence check.
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const RUNDIR = process.argv[2];
const PER_DOMAIN = Number(process.argv[3] || 4);
if (!RUNDIR) { console.error('usage: node v2-done-sample.mjs <rundir> [perDomain]'); process.exit(1); }

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const tasks = tasksDoc.tasks;

const byDomain = new Map();
for (const t of tasks) {
  if (t.state !== 'DONE') continue;
  if (!byDomain.has(t.domain)) byDomain.set(t.domain, []);
  byDomain.get(t.domain).push(t);
}
for (const arr of byDomain.values()) arr.sort((a, b) => a.id.localeCompare(b.id));

function stratifiedPick(arr, n) {
  if (arr.length <= n) return arr;
  const picked = [];
  const stride = arr.length / n;
  for (let i = 0; i < n; i++) picked.push(arr[Math.floor(i * stride)]);
  return picked;
}

const sample = [];
for (const [domain, arr] of [...byDomain.entries()].sort()) {
  sample.push(...stratifiedPick(arr, PER_DOMAIN));
}

function fileCheck(p) {
  if (!p) return { present: false, reason: 'no-path' };
  try {
    const st = fs.statSync(p);
    return { present: true, bytes: st.size, mtime: st.mtime };
  } catch {
    return { present: false, reason: 'missing' };
  }
}

function extractTestFile(testCmd) {
  const m = /node --test (.+)$/.exec(testCmd || '');
  return m ? m[1] : null;
}

const results = sample.map(t => {
  const ownerFileCheck = fileCheck(t.ownerFile);
  const testFilePath = extractTestFile(t.tests?.[0]);
  const testFileCheck = fileCheck(testFilePath);
  const evidencePaths = (t.evidence || []).map(e => e.replace(/\//g, '\\'));
  const evidenceChecks = evidencePaths.map(p => ({ path: p, ...fileCheck(p) }));
  let evidenceContent = null;
  let evidenceParseError = null;
  const firstPresentEvidence = evidenceChecks.find(e => e.present);
  if (firstPresentEvidence) {
    try {
      const raw = fs.readFileSync(firstPresentEvidence.path, 'utf8');
      evidenceContent = JSON.parse(raw);
    } catch (e) {
      evidenceParseError = String(e.message || e);
    }
  }

  const flags = [];
  if (!ownerFileCheck.present) flags.push('OWNER_FILE_MISSING');
  else if (ownerFileCheck.bytes < 80) flags.push('OWNER_FILE_SUSPICIOUSLY_SMALL');
  if (!testFileCheck.present) flags.push('TEST_FILE_MISSING');
  if (!firstPresentEvidence) flags.push('EVIDENCE_MISSING');
  if (evidenceParseError) flags.push('EVIDENCE_UNPARSEABLE');
  if (evidenceContent && JSON.stringify(evidenceContent) === '{}') flags.push('EVIDENCE_EMPTY_OBJECT');

  return {
    id: t.id,
    domain: t.domain,
    epicId: t.epicId,
    title: t.title,
    phase: t.phase,
    rc1Critical: t.rc1Critical,
    ownerFile: t.ownerFile,
    ownerFileCheck,
    testFilePath,
    testFileCheck,
    evidenceChecks,
    evidenceContentKeys: evidenceContent && typeof evidenceContent === 'object' ? Object.keys(evidenceContent) : null,
    evidenceParseError,
    flags,
  };
});

fs.writeFileSync(path.join(RUNDIR, 'DONE-SAMPLE-50.json'), JSON.stringify({ sampleSize: results.length, perDomain: PER_DOMAIN, results }, null, 2));

const flagged = results.filter(r => r.flags.length > 0);
console.log('sampleSize=', results.length);
console.log('flaggedCount=', flagged.length);
console.log('flaggedIds=', JSON.stringify(flagged.map(f => ({ id: f.id, flags: f.flags }))));
