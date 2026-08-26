#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v3-score-ready-tasks.mjs <rundir>'); process.exit(1); }

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const depsDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'DEPENDENCIES.json'), 'utf8'));
const tasks = tasksDoc.tasks;
const byId = new Map(tasks.map(t => [t.id, t]));

const fwdAdj = new Map();
for (const e of depsDoc.edges) {
  if (!byId.has(e.from) || !byId.has(e.to)) continue;
  if (!fwdAdj.has(e.from)) fwdAdj.set(e.from, []);
  fwdAdj.get(e.from).push(e.to);
}

// Transitive downstream count (BFS), capped for performance/sanity.
function downstreamCount(id) {
  const seen = new Set();
  const q = [id];
  while (q.length) {
    const cur = q.shift();
    for (const nxt of fwdAdj.get(cur) || []) {
      if (!seen.has(nxt)) { seen.add(nxt); q.push(nxt); }
    }
  }
  return seen.size;
}

const SIX_PRODUCT_DOMAINS = ['02-LIBRARY-FACTORY', '03-KEYBOARD-PRO', '04-KEYBOARD-CONVERTERS', '05-CREATOR', '06-STUDIO-PRO', '07-SINGY-CORE', '08-SINGY-KIDS', '09-SINGY-TEEN'];

const ready = tasks.filter(t => t.state === 'RETRY_READY');

const scored = ready.map(t => {
  const downstream = downstreamCount(t.id);
  const downstreamTasks = (fwdAdj.get(t.id) || []).map(id => byId.get(id));
  const downstreamDomains = new Set(downstreamTasks.map(d => d.domain));
  const sharedProductWeight = [...downstreamDomains].filter(d => SIX_PRODUCT_DOMAINS.includes(d)).length >= 2 ? 2 : ([...downstreamDomains].filter(d => SIX_PRODUCT_DOMAINS.includes(d)).length === 1 ? 1 : 0);
  const rc1CriticalWeight = t.rc1Critical ? 10 : 0;
  const commercialImpactWeight = (t.releaseTrain === 'RC1-COMMERCIAL-EARLY-ACCESS' ? 5 : 0) + (t.domain === '00-ORCHESTRATION' || t.domain === '01-SHARED-PLATFORM' ? 3 : 0);
  const unlockScore = downstream + rc1CriticalWeight + (sharedProductWeight * 5) + commercialImpactWeight;
  return {
    id: t.id, domain: t.domain, epicId: t.epicId, title: t.title, phase: t.phase,
    releaseTrain: t.releaseTrain, rc1Critical: t.rc1Critical,
    directDownstream: (fwdAdj.get(t.id) || []).length,
    transitiveDownstream: downstream,
    downstreamDomains: [...downstreamDomains],
    sharedProductWeight, rc1CriticalWeight, commercialImpactWeight,
    unlockScore,
    worktree: t.worktree,
  };
}).sort((a, b) => b.unlockScore - a.unlockScore);

const out = {
  generatedAt: new Date().toISOString(),
  formula: 'unlockScore = transitiveDownstreamCount + rc1CriticalWeight(10 if rc1Critical else 0) + sharedProductWeight(0/1/2 scaled by 5) + commercialImpactWeight(RC1 train +5, shared/orchestration domain +3)',
  totalReadyScored: scored.length,
  top40: scored.slice(0, 40),
};
fs.writeFileSync(path.join(runDir, 'TASK-SELECTION-SCORES.json'), JSON.stringify(out, null, 2));
console.log('scored', scored.length, 'tasks');
console.log(JSON.stringify(scored.slice(0, 20).map(s => ({ id: s.id, title: s.title, score: s.unlockScore, downstream: s.transitiveDownstream, rc1: s.rc1Critical })), null, 2));
