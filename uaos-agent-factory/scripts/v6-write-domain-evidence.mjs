#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const runDir = process.argv[2];
const tasksDoc = JSON.parse(fs.readFileSync('C:\\keyboard-manager-clean\\uaos-program-tree\\TASKS.json', 'utf8'));
const byId = new Map(tasksDoc.tasks.map(t => [t.id, t]));

function readEvidence(taskId) {
  const t = byId.get(taskId);
  const evidencePath = t.evidence[0].replace(/\//g, '\\');
  return JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
}

// --- ENTITLEMENT-EVIDENCE.json ---
const entitlementTasks = ['TASK-01-00097-ENTITLEMENTS_CONTRACT', 'TASK-01-00098-ENTITLEMENTS_IMPLEMENTATION', 'TASK-01-00099-ENTITLEMENTS_TESTS', 'TASK-01-00100-ENTITLEMENTS_EVIDENCE'];
const statesModeled = ['TRIAL_NOT_STARTED', 'TRIAL_ACTIVE', 'TRIAL_EXPIRED_READ_ONLY', 'LICENSED', 'LICENSE_EXPIRED_READ_ONLY', 'LICENSE_INVALID', 'LICENSE_WRONG_PRODUCT'];
fs.writeFileSync(path.join(runDir, 'ENTITLEMENT-EVIDENCE.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  feature: 'Entitlements (Trial + License state)',
  statesModeled,
  allStatesCoveredByRealTests: true,
  keyGuarantees: [
    'canOpenProjects is true in every one of the 7 states — an expired/invalid entitlement never blocks opening or deletes/encrypts/locks existing user projects.',
    'A valid, correctly-signed, unexpired, correct-product license always resolves to LICENSED, restoring full entitlement even after a trial has expired — verified directly with a trial-expired-then-activated test.',
    'The system clock is never read internally; every time-dependent check requires an injected `now: Date`.',
    'No hardware fingerprint and no network call anywhere in entitlement resolution — verified by a static source grep in the IMPLEMENT task\'s own test suite.',
  ],
  timeBoundaryTests: ['1ms before 14-day trial expiry -> TRIAL_ACTIVE', 'exactly at 14-day trial expiry -> TRIAL_EXPIRED_READ_ONLY (exclusive boundary)', '1ms after -> TRIAL_EXPIRED_READ_ONLY'],
  cryptoIntegration: 'Uses Batch 3\'s real Ed25519 Signed License Verification (verifyReceipt) — LICENSE_INVALID/LICENSE_WRONG_PRODUCT/LICENSE_EXPIRED_READ_ONLY states are all driven by genuine signature/expiry verification, not simulated.',
  perTaskEvidence: entitlementTasks.map(id => ({ taskId: id, ...readEvidence(id) })),
}, null, 2));

// --- USER-DATA-EXPORT-IMPORT-EVIDENCE.json ---
const exportImportTasks = ['TASK-01-00165-EXPORT_IMPORT_USER_DATA_CONTRACT', 'TASK-01-00166-EXPORT_IMPORT_USER_DATA_IMPLEMENTATION', 'TASK-01-00167-EXPORT_IMPORT_USER_DATA_TESTS', 'TASK-01-00168-EXPORT_IMPORT_USER_DATA_EVIDENCE'];
fs.writeFileSync(path.join(runDir, 'USER-DATA-EXPORT-IMPORT-EVIDENCE.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  feature: 'Export/Import User Data with Archive Safety',
  recoveryNote: 'IMPLEMENTATION was recovered from a broken prior-session/Aider partial edit (missing import, non-functional in-place "staging"). Rewritten from a clean, correct baseline this session — see INTERRUPTED-STATE-RECOVERY.json for the full diagnosis.',
  requiredExportBehaviorCovered: [
    'explicit source user-data root', 'recursive regular-file inventory (discoverRegularFiles)', 'safe normalized relative paths',
    'symbolic-link escape rejection (symlinks are refused outright, never followed)', 'SHA256 for every file', 'deterministic manifest ordering',
    'deterministic export receipt (buildReceipt, pure function of content, no wall-clock)', 'transactional package creation (AtomicSave)',
    'no mutation of source files (verified by a dedicated read-only test)', 'UTF-8 file preservation', 'binary file preservation (full 0x00-0xFF byte range tested)',
    'product ID and version metadata (optional productId/productVersion fields)',
  ],
  requiredImportBehaviorCovered: [
    'validates the entire package before any destination write', 'rejects absolute paths', 'rejects Windows drive-qualified paths', 'rejects ".." traversal',
    'rejects duplicate normalized paths', 'rejects missing entries (expectedRelativePaths)', 'rejects unexpected entries in strict mode',
    'verifies all SHA256 values before commit', 'imports into a sibling staging directory first', 'atomically commits only after complete validation',
    'rolls back on every failure (tested with a real deterministic filesystem failure: a path component colliding with an existing file)',
    'preserves pre-existing destination data after failure (both the entries the import would have touched and completely unrelated files)',
    'supports clean-destination import (cleanDestination)', 'produces a deterministic import receipt',
  ],
  noThirdPartyArchiveDependency: true,
  perTaskEvidence: exportImportTasks.map(id => ({ taskId: id, ...readEvidence(id) })),
}, null, 2));

console.log('domain evidence artifacts written');
