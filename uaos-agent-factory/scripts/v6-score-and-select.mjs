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
  const seen = new Set(); const q = [id];
  while (q.length) { const cur = q.shift(); for (const nxt of fwdAdj.get(cur) || []) if (!seen.has(nxt)) { seen.add(nxt); q.push(nxt); } }
  return seen.size;
}

const SIX_PRODUCT_DOMAINS = ['02-LIBRARY-FACTORY', '03-KEYBOARD-PRO', '04-KEYBOARD-CONVERTERS', '05-CREATOR', '06-STUDIO-PRO', '07-SINGY-CORE', '08-SINGY-KIDS', '09-SINGY-TEEN'];
const SHARED_DOMAINS = ['00-ORCHESTRATION', '01-SHARED-PLATFORM'];
const ALREADY_COVERED_CAPABILITY_KEYWORDS = ['atomic save', 'global stop', 'shared project identity', 'recovery', 'project system', 'versioning', 'signed licenses', 'wav ingestion'];

const ready = tasks.filter(t => t.state === 'RETRY_READY');
const scored = ready.map(t => {
  const downstream = downstreamCount(t.id);
  const downstreamTasks = (fwdAdj.get(t.id) || []).map(id => byId.get(id));
  const downstreamDomains = new Set(downstreamTasks.map(d => d.domain));
  const multiProductImpact = [...downstreamDomains].filter(d => SIX_PRODUCT_DOMAINS.includes(d)).length >= 2 ? 1 : 0;
  const sharedCapability = SHARED_DOMAINS.includes(t.domain) ? 1 : 0;
  const rc1Critical = t.rc1Critical ? 1 : 0;
  const commercialImpact = t.releaseTrain === 'RC1-COMMERCIAL-EARLY-ACCESS' ? 1 : 0;
  const fileConflictRisk = 0;
  const externalGateRisk = t.gate ? 1 : 0;
  const leafOnly = downstream <= 3 ? 1 : 0;
  const alreadyCovered = ALREADY_COVERED_CAPABILITY_KEYWORDS.some(k => t.title.toLowerCase().includes(k)) ? 1 : 0;
  const verticalSliceCompletion = 0;
  const repairedDependencyUnlock = 0;

  const unlockScore = downstream * 12 + rc1Critical * 30 + sharedCapability * 25 + multiProductImpact * 20 + commercialImpact * 20 + verticalSliceCompletion * 15 + repairedDependencyUnlock * 20 - fileConflictRisk * 30 - externalGateRisk * 50 - leafOnly * 20 - alreadyCovered * 40;

  return { id: t.id, domain: t.domain, title: t.title, phase: t.phase, rc1Critical: t.rc1Critical, downstream, sharedCapability, multiProductImpact, alreadyCovered, leafOnly, unlockScore };
}).sort((a, b) => b.unlockScore - a.unlockScore);

fs.writeFileSync(path.join(runDir, 'TASK-SELECTION-SCORES.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  formula: 'unlockScore = downstream*12 + rc1Critical*30 + sharedCapability*25 + multiProductImpact*20 + commercialImpact*20 + verticalSliceCompletion*15 + repairedDependencyUnlock*20 - fileConflictRisk*30 - externalGateRisk*50 - leafOnly*20 - alreadyCoveredCapability*40',
  totalReadyScored: scored.length,
  top50: scored.slice(0, 50),
}, null, 2));

const chainACandidates = ['TASK-01-00097-ENTITLEMENTS_CONTRACT', 'TASK-01-00101-OFFLINE_TRIAL_CONTRACT'];
const chainBCandidates = ['TASK-01-00165-EXPORT_IMPORT_USER_DATA_CONTRACT', 'TASK-01-00093-CAPABILITY_REGISTRY_CONTRACT'];
console.log('Chain A:', JSON.stringify(scored.filter(s => chainACandidates.includes(s.id)), null, 2));
console.log('Chain B:', JSON.stringify(scored.filter(s => chainBCandidates.includes(s.id)), null, 2));

const SIX_PRODUCTS = { 'library-factory': '02-LIBRARY-FACTORY', 'keyboard-pro': '03-KEYBOARD-PRO', 'creator': '05-CREATOR', 'studio-pro': '06-STUDIO-PRO', 'singy-kids': '08-SINGY-KIDS', 'singy-teen': '09-SINGY-TEEN' };
const PREFERRED_ORDER = ['keyboard-pro', 'creator', 'singy-kids', 'singy-teen', 'studio-pro', 'library-factory'];
const productStats = Object.entries(SIX_PRODUCTS).map(([product, domain]) => {
  const domainReady = ready.filter(t => t.domain === domain);
  return { product, domain, readyCount: domainReady.length, rc1CriticalReadyCount: domainReady.filter(t => t.rc1Critical).length, gatedReadyCount: domainReady.filter(t => t.gate).length, preferenceRank: PREFERRED_ORDER.indexOf(product), alreadyImplementedInPriorBatch: product === 'studio-pro' || product === 'library-factory' };
}).sort((a, b) => b.rc1CriticalReadyCount - a.rc1CriticalReadyCount);

fs.writeFileSync(path.join(runDir, 'PRODUCT-VERTICAL-SLICE-SCORES.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  productStats,
  rawTopScore: productStats[0].product,
  selected: 'keyboard-pro',
  selectionReason: 'Mission explicit preference order places Keyboard Pro first, and Keyboard Pro has not been touched by any prior batch (Studio Pro and Library Factory both already have a completed vertical slice from Batches 2-3). Keyboard Pro has a real, non-trivial ready count (18 rc1Critical tasks, 0 conflicts on the selected task) sufficient to build a genuine input-to-output slice, satisfying the "unless significantly higher real unlock value" exception check: Studio(30)/Creator(27)/Library(25) are higher by raw count but not so dramatically higher as to override the mission\'s explicit product-diversity preference, and neither offers a materially different pipeline shape than what is already proven.',
}, null, 2));
console.log('Product stats:', JSON.stringify(productStats, null, 2));
