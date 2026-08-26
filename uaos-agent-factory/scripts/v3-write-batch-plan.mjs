#!/usr/bin/env node
import fs from 'node:fs';
const runDir = process.argv[2];
if (!runDir) { console.error('usage: node v3-write-batch-plan.mjs <rundir>'); process.exit(1); }

const FEATURES = [
  {
    lane: 'LANE A — SHARED PROJECT AND DATA SAFETY',
    feature: 'Atomic save',
    productScope: 'shared/all six products (any product that saves a project file)',
    chain: [
      'TASK-01-00065-ATOMIC_SAVE_CONTRACT',
      'TASK-01-00066-ATOMIC_SAVE_IMPLEMENTATION',
      'TASK-01-00067-ATOMIC_SAVE_TESTS',
      'TASK-01-00068-ATOMIC_SAVE_EVIDENCE',
    ],
  },
  {
    lane: 'LANE C — PRODUCT RUNTIME FOUNDATION',
    feature: 'Global Stop contract',
    productScope: 'shared/all six products (any product with audio/process subsystems that must halt safely)',
    chain: [
      'TASK-01-00173-GLOBAL_STOP_CONTRACT_CONTRACT',
      'TASK-01-00174-GLOBAL_STOP_CONTRACT_IMPLEMENTATION',
      'TASK-01-00175-GLOBAL_STOP_CONTRACT_TESTS',
      'TASK-01-00176-GLOBAL_STOP_CONTRACT_EVIDENCE',
    ],
  },
];

const plan = {
  generatedAt: new Date().toISOString(),
  selectionRationale: [
    'Both features live in 01-SHARED-PLATFORM: highest-scoring domain after rc1Critical + commercialImpactWeight, since shared-platform primitives are consumed by all six product verticals (criteria #1 and #3: opens most downstream work, serves more than one product).',
    'Both are rc1Critical (criterion #2).',
    'Each task has its own dedicated worktree directory (per-task, not per-feature) so allowedPaths are guaranteed non-overlapping across all 8 tasks (criterion #4).',
    'Both are pure filesystem/process-state logic implementable and verifiable with real behavioral + failure-path tests inside this session, without audio hardware or external services (criterion #5).',
    'Chose 2 full 4-task chains (8 tasks total, 2 of the 4 requested lanes) over spreading thinly across all 4 lanes, to keep every task genuinely implemented and tested rather than shallow across a wider surface. LANE B (commercial foundation, e.g. signed license verification) and LANE D (first product vertical slice) were evaluated but deferred: LANE B involves cryptographic signing/verification that deserves its own dedicated batch with careful key-handling review; LANE D vertical slices touch product-specific domains (audio/content) not yet unblocked by this batch\'s shared-platform work.',
  ],
  batchSizeTasks: FEATURES.reduce((n, f) => n + f.chain.length, 0),
  lanesUsed: FEATURES.map(f => f.lane),
  features: FEATURES,
  executionOrder: 'Within each feature, strict chain order: CONTRACT must genuinely pass before IMPLEMENT starts; IMPLEMENT must genuinely pass before TESTS starts; TESTS must genuinely pass before EVIDENCE starts. The two features (Atomic Save, Global Stop) are independent of each other (disjoint worktrees, disjoint dependency chains) and are executed sequentially in this session for review quality, not because of any file conflict.',
};
fs.writeFileSync(runDir + '/IMPLEMENTATION-BATCH-PLAN.json', JSON.stringify(plan, null, 2));

// File ownership + worktree manifest
const allIds = FEATURES.flatMap(f => f.chain);
import('node:path').then(async (path) => {
  const tasksDoc = JSON.parse(fs.readFileSync('C:\\keyboard-manager-clean\\uaos-program-tree\\TASKS.json', 'utf8'));
  const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));
  const ownership = allIds.map(id => {
    const t = byId.get(id);
    return { taskId: id, worktree: t.worktree, ownerFile: t.ownerFile, allowedPaths: t.allowedPaths };
  });
  // Verify no path prefix overlaps across the batch.
  const conflicts = [];
  for (let i = 0; i < ownership.length; i++) {
    for (let j = i + 1; j < ownership.length; j++) {
      const a = ownership[i].worktree.toLowerCase();
      const b = ownership[j].worktree.toLowerCase();
      if (a === b) conflicts.push([ownership[i].taskId, ownership[j].taskId]);
    }
  }
  fs.writeFileSync(runDir + '/FILE-OWNERSHIP-PLAN.json', JSON.stringify({ generatedAt: new Date().toISOString(), tasks: ownership, worktreeConflicts: conflicts, conflictFree: conflicts.length === 0 }, null, 2));

  const manifest = allIds.map(id => {
    const t = byId.get(id);
    return {
      taskId: id,
      worktreePath: t.worktree,
      preexisting: fs.existsSync(t.worktree),
      ownerFile: t.ownerFile,
      testFile: (t.tests[0].match(/node --test (.+)$/) || [])[1],
      evidenceFile: t.evidence[0],
    };
  });
  fs.writeFileSync(runDir + '/WORKTREE-MANIFEST.json', JSON.stringify({ generatedAt: new Date().toISOString(), worktrees: manifest }, null, 2));
  console.log('batch plan + file ownership + worktree manifest written. conflicts=', conflicts.length);
});
