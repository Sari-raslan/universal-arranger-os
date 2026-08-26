'use strict';
/**
 * Library V18 — Content Readiness & Provenance Core (schemas/fixtures only, no real audio)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LICENSE_CLASSES = ['public-domain', 'permissive', 'restricted', 'unknown'];

function sha256(obj) {
  return crypto.createHash('sha256').update(typeof obj === 'string' ? obj : JSON.stringify(obj)).digest('hex');
}

function createProvenance(fields = {}) {
  return {
    schemaVersion: 'uaos.library.provenance/v18',
    sourceId: fields.sourceId || crypto.randomUUID(),
    sourceUrl: fields.sourceUrl || null,
    contributor: fields.contributor || null,
    acquisitionDate: fields.acquisitionDate || new Date().toISOString().slice(0, 10),
    originalFilename: fields.originalFilename || null,
    normalizedFilename: fields.normalizedFilename || null,
    fileSha256: fields.fileSha256 || null
  };
}

function createLicenseRecord(fields = {}) {
  const rec = {
    schemaVersion: 'uaos.library.license/v18',
    licenseId: fields.licenseId || crypto.randomUUID(),
    class: fields.class || 'unknown',
    commercialUse: !!fields.commercialUse,
    redistribution: !!fields.redistribution,
    modification: !!fields.modification,
    attributionRequired: !!fields.attributionRequired,
    attributionText: fields.attributionText || null,
    evidenceRefs: Array.isArray(fields.evidenceRefs) ? fields.evidenceRefs : []
  };
  return rec;
}

function validateLicense(rec) {
  const errors = [];
  if (!rec || typeof rec !== 'object') return { ok: false, errors: ['NOT_OBJECT'] };
  if (!LICENSE_CLASSES.includes(rec.class)) errors.push('BAD_CLASS');
  if (!rec.licenseId) errors.push('MISSING_LICENSE');
  if (rec.attributionRequired && !rec.attributionText) errors.push('ATTRIBUTION_REQUIRED');
  if (rec.class === 'unknown' && rec.commercialUse) errors.push('UNKNOWN_CANNOT_COMMERCIAL');
  if (!rec.redistribution && rec.commercialUse) errors.push('REDISTRIBUTION_RESTRICTED');
  return { ok: errors.length === 0, errors };
}

function createContentRecord(fields = {}) {
  return {
    schemaVersion: 'uaos.library.content/v18',
    contentId: fields.contentId || crypto.randomUUID(),
    sampleSetId: fields.sampleSetId || null,
    instrumentId: fields.instrumentId || null,
    articulationId: fields.articulationId || null,
    note: fields.note ?? null,
    velocity: fields.velocity ?? null,
    roundRobin: fields.roundRobin || null,
    loop: fields.loop || null,
    sampleRate: fields.sampleRate || null,
    channels: fields.channels || null,
    provenance: fields.provenance || createProvenance(),
    license: fields.license || null,
    quarantine: !!fields.quarantine,
    approvalState: fields.approvalState || 'pending',
    commercialReleaseGate: fields.commercialReleaseGate || 'BLOCKED_PENDING_LICENSE_AND_CONTENT'
  };
}

function validateContent(rec) {
  const errors = [];
  if (!rec.contentId) errors.push('MISSING_CONTENT_ID');
  if (!rec.license) errors.push('MISSING_LICENSE');
  else {
    const lv = validateLicense(rec.license);
    if (!lv.ok) errors.push(...lv.errors.map((e) => `LICENSE:${e}`));
  }
  if (!rec.provenance?.fileSha256 && !rec.quarantine) errors.push('MISSING_SHA_OR_QUARANTINE');
  return { ok: errors.length === 0, errors };
}

class ContentRegistry {
  constructor() { this.items = new Map(); this.byHash = new Map(); }
  add(rec) {
    const v = validateContent(rec);
    if (!v.ok) throw Object.assign(new Error(`INVALID_CONTENT:${v.errors.join(',')}`), { code: 'INVALID_CONTENT', errors: v.errors });
    const hash = rec.provenance.fileSha256;
    if (hash && this.byHash.has(hash)) throw Object.assign(new Error('DUPLICATE_CONTENT'), { code: 'DUPLICATE_CONTENT' });
    this.items.set(rec.contentId, rec);
    if (hash) this.byHash.set(hash, rec.contentId);
    return rec;
  }
  quarantine(id, reason) {
    const r = this.items.get(id);
    if (!r) throw Object.assign(new Error('MISSING'), { code: 'MISSING' });
    r.quarantine = true;
    r.approvalState = 'quarantined';
    r.quarantineReason = reason;
    return r;
  }
  diagnoseMissing() {
    return [...this.items.values()].filter((r) => !r.provenance?.fileSha256 || r.quarantine);
  }
}

function deterministicIngestManifest(records) {
  const entries = records.map((r) => ({
    contentId: r.contentId,
    sha256: r.provenance.fileSha256,
    licenseId: r.license?.licenseId || null
  })).sort((a, b) => String(a.contentId).localeCompare(String(b.contentId)));
  return { schemaVersion: 'uaos.library.ingest-manifest/v18', entries, sha256: sha256(entries) };
}

function dryRunIngest(records) {
  const reg = new ContentRegistry();
  const report = { ok: true, accepted: 0, rejected: [], quarantine: 0 };
  for (const r of records) {
    try {
      reg.add(JSON.parse(JSON.stringify(r)));
      report.accepted++;
    } catch (e) {
      report.ok = false;
      report.rejected.push({ contentId: r.contentId, code: e.code, errors: e.errors || [e.message] });
    }
  }
  report.quarantine = reg.diagnoseMissing().length;
  report.manifest = deterministicIngestManifest([...reg.items.values()]);
  return report;
}

function transactionalIngest(records, stagingDir) {
  fs.mkdirSync(stagingDir, { recursive: true });
  const report = dryRunIngest(records);
  const stageFile = path.join(stagingDir, 'ingest.staging.json');
  const tmp = stageFile + `.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(report, null, 2));
  fs.renameSync(tmp, stageFile);
  return { stagingDir, stageFile, report };
}

function rollbackIngest(stagingDir) {
  if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
  return { rolledBack: true };
}

function exportLicenseLedger(records) {
  return {
    schemaVersion: 'uaos.library.license-ledger/v18',
    exportedAt: new Date().toISOString(),
    entries: records.map((r) => ({
      contentId: r.contentId,
      license: r.license,
      attribution: r.license?.attributionText || null,
      commercialReleaseGate: r.commercialReleaseGate
    }))
  };
}

/** Legal fixture records WITHOUT audio bytes */
function fixtureRecords() {
  const lic = createLicenseRecord({
    class: 'permissive',
    commercialUse: true,
    redistribution: true,
    modification: true,
    attributionRequired: true,
    attributionText: 'Fixture Attribution (synthetic, no audio)',
    evidenceRefs: ['fixture://license/cc0-like']
  });
  const ok = createContentRecord({
    sampleSetId: 'fixture-set-1',
    instrumentId: 'piano',
    articulationId: 'sustain',
    note: 60,
    velocity: 100,
    roundRobin: { index: 0, count: 2 },
    loop: { start: 0, end: 1000 },
    sampleRate: 48000,
    channels: 2,
    provenance: createProvenance({
      originalFilename: 'fixture-C4.wav',
      normalizedFilename: 'fixture_c4.wav',
      fileSha256: sha256('fixture-audio-placeholder-not-real'),
      sourceUrl: 'fixture://synthetic'
    }),
    license: lic,
    approvalState: 'approved-fixture-only',
    commercialReleaseGate: 'BLOCKED_NO_REAL_CONTENT'
  });
  const missingLic = createContentRecord({
    provenance: createProvenance({ fileSha256: sha256('x') }),
    license: null
  });
  return { ok, missingLic, lic };
}

module.exports = {
  LICENSE_CLASSES,
  createProvenance,
  createLicenseRecord,
  validateLicense,
  createContentRecord,
  validateContent,
  ContentRegistry,
  deterministicIngestManifest,
  dryRunIngest,
  transactionalIngest,
  rollbackIngest,
  exportLicenseLedger,
  fixtureRecords,
  sha256
};
