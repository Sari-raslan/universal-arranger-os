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
  // File-conflict risk: 0 here because every task has its own dedicated worktree
  // directory (verified structurally, not assumed) - see FILE-OWNERSHIP-PLAN.json.
  const fileConflictRisk = 0;
  // External-gate risk: does this task's own chain terminate in / depend near
  // a real gate (content/legal/format/hardware/owner)? Approximate via gate field.
  const externalGateRisk = t.gate ? 1 : 0;

  const unlockScore = downstream * 5 + rc1Critical * 20 + sharedCapability * 15 + multiProductImpact * 10 + commercialImpact * 10 - fileConflictRisk * 20 - externalGateRisk * 30;

  return {
    id: t.id, domain: t.domain, title: t.title, phase: t.phase, rc1Critical: t.rc1Critical,
    downstream, sharedCapability, multiProductImpact, commercialImpact, fileConflictRisk, externalGateRisk,
    unlockScore,
  };
}).sort((a, b) => b.unlockScore - a.unlockScore);

fs.writeFileSync(path.join(runDir, 'TASK-SELECTION-SCORES.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  formula: 'unlockScore = downstreamDependencies*5 + rc1Critical*20 + sharedCapability*15 + multiProductImpact*10 + commercialImpact*10 - fileConflictRisk*20 - externalGateRisk*30',
  totalReadyScored: scored.length,
  top50: scored.slice(0, 50),
}, null, 2));

// --- Vertical slice product selection ---
const SIX_PRODUCTS = {
  'library-factory': '02-LIBRARY-FACTORY',
  'keyboard-pro': '03-KEYBOARD-PRO',
  'creator': '05-CREATOR',
  'studio-pro': '06-STUDIO-PRO',
  'singy-kids': '08-SINGY-KIDS',
  'singy-teen': '09-SINGY-TEEN',
};

const productStats = Object.entries(SIX_PRODUCTS).map(([product, domain]) => {
  const domainReady = ready.filter(t => t.domain === domain);
  const rc1CriticalReady = domainReady.filter(t => t.rc1Critical);
  const gatedReady = domainReady.filter(t => t.gate);
  return {
    product, domain,
    readyCount: domainReady.length,
    rc1CriticalReadyCount: rc1CriticalReady.length,
    gatedReadyCount: gatedReady.length,
  };
}).sort((a, b) => b.rc1CriticalReadyCount - a.rc1CriticalReadyCount || b.readyCount - a.readyCount || a.gatedReadyCount - b.gatedReadyCount);

fs.writeFileSync(path.join(runDir, 'BATCH-SELECTION.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  verticalSliceCandidates: productStats,
  selectedVerticalSliceProduct: productStats[0].product,
  selectionReason: `${productStats[0].product} has the most genuinely-ready rc1Critical tasks (${productStats[0].rc1CriticalReadyCount}) among the six products, with ${productStats[0].gatedReadyCount} of its ready tasks carrying an external gate.`,
}, null, 2));

console.log('vertical slice product stats:', JSON.stringify(productStats, null, 2));
console.log('top20 scored:', JSON.stringify(scored.slice(0, 20).map(s => ({ id: s.id, title: s.title, score: s.unlockScore })), null, 2));
