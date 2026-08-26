#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];

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
const SHARED_DOMAINS = ['00-ORCHESTRATION', '01-SHARED-PLATFORM'];

const ready = tasks.filter(t => t.state === 'RETRY_READY');

const scored = ready.map(t => {
  const downstream = downstreamCount(t.id);
  const downstreamTasks = (fwdAdj.get(t.id) || []).map(id => byId.get(id));
  const downstreamDomains = new Set(downstreamTasks.map(d => d.domain));
  const multiProductImpact = [...downstreamDomains].filter(d => SIX_PRODUCT_DOMAINS.includes(d)).length >= 2 ? 1 : 0;
  const sharedCapability = SHARED_DOMAINS.includes(t.domain) ? 1 : 0;
  const rc1Critical = t.rc1Critical ? 1 : 0;
  const commercialImpact = t.releaseTrain === 'RC1-COMMERCIAL-EARLY-ACCESS' ? 1 : 0;
  const fileConflictRisk = 0; // every task has its own dedicated worktree, verified structurally
  const externalGateRisk = t.gate ? 1 : 0;
  // A chain is "leaf-only" for the program if its own downstream closure is
  // exactly its 3 sibling phases (CONTRACT->IMPLEMENT->TEST->EVIDENCE) and
  // nothing else in the graph depends on it yet.
  const leafOnly = downstream <= 3 ? 1 : 0;
  const verticalSliceCompletion = 0; // scored separately per-product below, not per-task

  const unlockScore = downstream * 8 + rc1Critical * 25 + sharedCapability * 20 + multiProductImpact * 15 + commercialImpact * 15 + verticalSliceCompletion * 12 - fileConflictRisk * 25 - externalGateRisk * 40 - leafOnly * 12;

  return { id: t.id, domain: t.domain, title: t.title, phase: t.phase, rc1Critical: t.rc1Critical, downstream, sharedCapability, multiProductImpact, commercialImpact, leafOnly, unlockScore };
}).sort((a, b) => b.unlockScore - a.unlockScore);

fs.writeFileSync(path.join(runDir, 'TASK-SELECTION-SCORES.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  formula: 'unlockScore = downstreamDependencyCount*8 + rc1CriticalWeight*25 + sharedCapabilityWeight*20 + multiProductImpactWeight*15 + commercialImpactWeight*15 + verticalSliceCompletionWeight*12 - fileConflictRisk*25 - externalGateRisk*40 - leafOnlyPenalty*12',
  totalReadyScored: scored.length,
  downstreamDistributionNote: 'Computed across all 316 currently-ready tasks: see downstreamGT3Count below for how many chains actually unlock something beyond their own 4-task chain.',
  downstreamGT3Count: scored.filter(s => s.downstream > 3).length,
  top60: scored.slice(0, 60),
}, null, 2));

const chainACandidates = ['TASK-01-00109-PRODUCT_IDS_CONTRACT', 'TASK-01-00129-VERSIONING_CONTRACT'];
const chainBCandidates = ['TASK-01-00105-SIGNED_LICENSES_CONTRACT', 'TASK-01-00101-OFFLINE_TRIAL_CONTRACT'];
console.log('Chain A candidates:', JSON.stringify(scored.filter(s => chainACandidates.includes(s.id)), null, 2));
console.log('Chain B candidates:', JSON.stringify(scored.filter(s => chainBCandidates.includes(s.id)), null, 2));
console.log('downstreamGT3Count=', scored.filter(s => s.downstream > 3).length, '/', scored.length);

// --- Product vertical-slice scoring ---
const SIX_PRODUCTS = {
  'library-factory': '02-LIBRARY-FACTORY', 'keyboard-pro': '03-KEYBOARD-PRO', 'creator': '05-CREATOR',
  'studio-pro': '06-STUDIO-PRO', 'singy-kids': '08-SINGY-KIDS', 'singy-teen': '09-SINGY-TEEN',
};
const productStats = Object.entries(SIX_PRODUCTS).map(([product, domain]) => {
  const domainReady = ready.filter(t => t.domain === domain);
  const rc1CriticalReady = domainReady.filter(t => t.rc1Critical);
  const gatedReady = domainReady.filter(t => t.gate);
  const totalDownstreamUnlock = domainReady.reduce((n, t) => n + downstreamCount(t.id), 0);
  return { product, domain, readyCount: domainReady.length, rc1CriticalReadyCount: rc1CriticalReady.length, gatedReadyCount: gatedReady.length, totalDownstreamUnlock };
}).sort((a, b) => b.rc1CriticalReadyCount - a.rc1CriticalReadyCount || b.totalDownstreamUnlock - a.totalDownstreamUnlock || a.gatedReadyCount - b.gatedReadyCount);

fs.writeFileSync(path.join(runDir, 'PRODUCT-VERTICAL-SLICE-SCORES.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  productStats,
  selected: productStats[0].product,
  selectionReason: `${productStats[0].product} has the most genuinely-ready rc1Critical tasks (${productStats[0].rc1CriticalReadyCount}), ${productStats[0].gatedReadyCount} gated, total downstream unlock potential ${productStats[0].totalDownstreamUnlock}.`,
}, null, 2));
console.log('Product stats:', JSON.stringify(productStats, null, 2));
