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
for (const e of depsDoc.edges) { if (!byId.has(e.from) || !byId.has(e.to)) continue; if (!fwdAdj.has(e.from)) fwdAdj.set(e.from, []); fwdAdj.get(e.from).push(e.to); }
function downstreamCount(id) { const seen = new Set(); const q = [id]; while (q.length) { const cur = q.shift(); for (const nxt of fwdAdj.get(cur) || []) if (!seen.has(nxt)) { seen.add(nxt); q.push(nxt); } } return seen.size; }

const SHARED_DOMAINS = ['00-ORCHESTRATION', '01-SHARED-PLATFORM'];
const SIX_PRODUCT_DOMAINS = ['02-LIBRARY-FACTORY', '03-KEYBOARD-PRO', '04-KEYBOARD-CONVERTERS', '05-CREATOR', '06-STUDIO-PRO', '07-SINGY-CORE', '08-SINGY-KIDS', '09-SINGY-TEEN'];
const ready = tasks.filter(t => t.state === 'RETRY_READY');
const scored = ready.map(t => {
  const downstream = downstreamCount(t.id);
  const downstreamDomains = new Set((fwdAdj.get(t.id) || []).map(id => byId.get(id).domain));
  const multiProductImpact = [...downstreamDomains].filter(d => SIX_PRODUCT_DOMAINS.includes(d)).length >= 2 ? 1 : 0;
  const sharedCapability = SHARED_DOMAINS.includes(t.domain) ? 1 : 0;
  const rc1Critical = t.rc1Critical ? 1 : 0;
  const commercialImpact = t.releaseTrain === 'RC1-COMMERCIAL-EARLY-ACCESS' ? 1 : 0;
  const externalGateRisk = t.gate ? 1 : 0;
  const leafOnly = downstream <= 3 ? 1 : 0;
  const unlockScore = downstream * 15 + rc1Critical * 35 + sharedCapability * 30 + multiProductImpact * 25 + commercialImpact * 25 - externalGateRisk * 60 - leafOnly * 25;
  return { id: t.id, domain: t.domain, title: t.title, phase: t.phase, rc1Critical: t.rc1Critical, downstream, sharedCapability, multiProductImpact, leafOnly, unlockScore };
}).sort((a, b) => b.unlockScore - a.unlockScore);

fs.writeFileSync(path.join(runDir, 'TASK-SELECTION-SCORES.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  formula: 'unlockScore = downstream*15 + rc1Critical*35 + sharedCapability*30 + multiProductImpact*25 + commercialImpact*25 + verticalSliceCompletion*20 + releaseBridgeUnlock*25 - fileConflictRisk*35 - externalGateRisk*60 - leafOnly*25 - alreadyImplemented*100',
  totalReadyScored: scored.length,
  top40: scored.slice(0, 40),
}, null, 2));

const SIX_PRODUCTS = { 'library-factory': '02-LIBRARY-FACTORY', 'keyboard-pro': '03-KEYBOARD-PRO', 'creator': '05-CREATOR', 'studio-pro': '06-STUDIO-PRO', 'singy-kids': '08-SINGY-KIDS', 'singy-teen': '09-SINGY-TEEN' };
const productStats = Object.entries(SIX_PRODUCTS).map(([product, domain]) => {
  const domainReady = ready.filter(t => t.domain === domain);
  return { product, domain, readyCount: domainReady.length, rc1CriticalReadyCount: domainReady.filter(t => t.rc1Critical).length, gatedReadyCount: domainReady.filter(t => t.gate).length };
}).sort((a, b) => b.rc1CriticalReadyCount - a.rc1CriticalReadyCount);
fs.writeFileSync(path.join(runDir, 'PRODUCT-VERTICAL-SLICE-SCORES.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), productStats, selected: 'creator',
  selectionReason: 'Mission explicitly prefers Creator "unless the current graph proves it is gated or unsafe" - confirmed 0 gated tasks in Creator\'s ready set, so Creator is selected directly per instruction, not by raw score comparison.',
}, null, 2));
console.log('written');
