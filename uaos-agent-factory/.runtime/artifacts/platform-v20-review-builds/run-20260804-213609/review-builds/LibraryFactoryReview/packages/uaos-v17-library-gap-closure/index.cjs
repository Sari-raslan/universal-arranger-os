'use strict';
/**
 * Library V17 — technical gap closure helpers (no fake licenses/content)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GAP_CLASSIFICATION = [
  { id: 'commercial-rights-review', text: 'commercial/rights review still required per validator', class: 'COMMERCIAL_POLICY_REQUIRED' },
  { id: 'not-commercial-ready', text: 'not commercial ready', class: 'COMMERCIAL_POLICY_REQUIRED' },
  { id: 'empty-v15-patch', text: 'empty V15 patch — verified clean base commit', class: 'ALREADY_CLOSED' },
  { id: 'owner-adoption', text: 'owner adoption approval required', class: 'OWNER_APPROVAL_REQUIRED' },
  { id: 'stale-lock-recovery', text: 'stale lock recovery verification helper', class: 'TECHNICAL_SAFE_TO_CLOSE' },
  { id: 'journal-validation', text: 'journal validation helper', class: 'TECHNICAL_SAFE_TO_CLOSE' },
  { id: 'deterministic-manifest', text: 'deterministic manifest hashing', class: 'TECHNICAL_SAFE_TO_CLOSE' },
  { id: 'missing-sample-diagnostics', text: 'missing sample diagnostics (no fake samples)', class: 'TECHNICAL_SAFE_TO_CLOSE' },
  { id: 'rollback-verification', text: 'rollback verification helper', class: 'TECHNICAL_SAFE_TO_CLOSE' }
];

function atomicWrite(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

function deterministicManifest(entries) {
  const sorted = [...entries].map((e) => ({ ...e })).sort((a, b) => String(a.path).localeCompare(String(b.path)));
  const body = JSON.stringify(sorted);
  return { schemaVersion: 'uaos.library.manifest/v17', entries: sorted, sha256: crypto.createHash('sha256').update(body).digest('hex') };
}

function validateJournal(journal) {
  const errors = [];
  if (!journal || typeof journal !== 'object') return { ok: false, errors: ['NOT_OBJECT'] };
  if (!journal.projectId) errors.push('MISSING_PROJECT_ID');
  if (!journal.at) errors.push('MISSING_AT');
  if (typeof journal.interrupted !== 'boolean') errors.push('MISSING_INTERRUPTED');
  return { ok: errors.length === 0, errors };
}

function recoverStaleLock(lock, { now = Date.now(), ttlMs = 60000 } = {}) {
  if (!lock) return { recovered: false, reason: 'NO_LOCK' };
  if (!lock.owner || !lock.acquiredAt) return { recovered: false, reason: 'INVALID_LOCK' };
  const age = now - new Date(lock.acquiredAt).getTime();
  if (age > ttlMs) return { recovered: true, reason: 'STALE', cleared: true };
  return { recovered: false, reason: 'ACTIVE', lock };
}

function diagnoseMissingSamples(catalog = []) {
  const missing = catalog.filter((s) => !s || !s.path || s.missing === true || s.exists === false);
  return {
    ok: missing.length === 0,
    missingCount: missing.length,
    diagnostics: missing.map((s) => ({ id: s.id || s.sampleId || null, reason: s.reason || 'MISSING_OR_UNPATHED' }))
  };
}

function verifyRollback(before, after) {
  const b = crypto.createHash('sha256').update(JSON.stringify(before)).digest('hex');
  const a = crypto.createHash('sha256').update(JSON.stringify(after)).digest('hex');
  return { ok: b === a, beforeHash: b, afterHash: a };
}

function closableGaps() {
  return GAP_CLASSIFICATION.filter((g) => g.class === 'TECHNICAL_SAFE_TO_CLOSE');
}

function remainingOwnerOrContentGaps() {
  return GAP_CLASSIFICATION.filter((g) => ['OWNER_APPROVAL_REQUIRED', 'COMMERCIAL_POLICY_REQUIRED', 'LICENSE_OR_CONTENT_REQUIRED'].includes(g.class));
}

module.exports = {
  GAP_CLASSIFICATION,
  atomicWrite,
  deterministicManifest,
  validateJournal,
  recoverStaleLock,
  diagnoseMissingSamples,
  verifyRollback,
  closableGaps,
  remainingOwnerOrContentGaps
};
