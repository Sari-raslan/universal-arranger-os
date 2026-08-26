#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TREE = 'C:\\keyboard-manager-clean\\uaos-program-tree';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v2-rc1-ready-queue.mjs <rundir>'); process.exit(1); }

const tasksDoc = JSON.parse(fs.readFileSync(path.join(TREE, 'TASKS.json'), 'utf8'));
const tasks = tasksDoc.tasks;

const SIX_PRODUCT_DOMAINS = new Set([
  '02-LIBRARY-FACTORY',
  '03-KEYBOARD-PRO',
  '05-CREATOR',
  '06-STUDIO-PRO',
  '08-SINGY-KIDS',
  '09-SINGY-TEEN',
]);

const ready = tasks.filter(t => t.state === 'RETRY_READY');
const rc1CriticalReady = ready.filter(t => t.rc1Critical);
const sixProductReady = rc1CriticalReady.filter(t => SIX_PRODUCT_DOMAINS.has(t.domain));
const infraReady = rc1CriticalReady.filter(t => !SIX_PRODUCT_DOMAINS.has(t.domain));

function summarize(t) {
  return {
    id: t.id,
    domain: t.domain,
    epicId: t.epicId,
    title: t.title,
    phase: t.phase,
    releaseTrain: t.releaseTrain,
    priority: t.priority,
    worktree: t.worktree,
    tests: t.tests,
    acceptanceCriteria: t.acceptanceCriteria,
  };
}

const byDomain = {};
for (const t of sixProductReady) {
  byDomain[t.domain] = byDomain[t.domain] || [];
  byDomain[t.domain].push(summarize(t));
}

const queue = {
  generatedAt: new Date().toISOString(),
  note: 'Genuinely READY tasks (zero unresolved predecessors) after the V2 truth-audit reclassification. rc1Critical + six-product-domain tasks only; infra/orchestration RC1-critical readiness tracked separately.',
  totalReadyAllDomains: ready.length,
  totalRc1CriticalReady: rc1CriticalReady.length,
  sixProductReadyCount: sixProductReady.length,
  infraReadyCount: infraReady.length,
  sixProductReadyByDomain: Object.fromEntries(Object.entries(byDomain).map(([k, v]) => [k, v.length])),
  sixProductReadyTasks: byDomain,
  infraReadyTasks: infraReady.map(summarize),
};
fs.writeFileSync(path.join(runDir, 'COMMERCIAL-RC1-READY-QUEUE.json'), JSON.stringify(queue, null, 2));
console.log('totalReady=', ready.length, 'rc1CriticalReady=', rc1CriticalReady.length, 'sixProductReady=', sixProductReady.length, 'infraReady=', infraReady.length);
console.log('byDomain=', JSON.stringify(queue.sixProductReadyByDomain));
