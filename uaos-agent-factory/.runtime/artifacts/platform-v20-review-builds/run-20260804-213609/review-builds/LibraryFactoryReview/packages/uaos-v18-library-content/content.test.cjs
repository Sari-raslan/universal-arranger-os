'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  validateLicense, validateContent, ContentRegistry, dryRunIngest, transactionalIngest,
  rollbackIngest, deterministicIngestManifest, exportLicenseLedger, fixtureRecords, createLicenseRecord, createContentRecord, createProvenance, sha256
} = require('./index.cjs');

let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

const fx = fixtureRecords();
if (validateLicense(fx.lic).ok) ok('license schema validation'); else bad('lic');
if (validateContent(fx.ok).ok) ok('provenance/content validation'); else bad('content');
if (!validateContent(fx.missingLic).ok) ok('missing license rejection'); else bad('misslic');

const restricted = createLicenseRecord({ class: 'restricted', commercialUse: true, redistribution: false });
if (!validateLicense(restricted).ok) ok('redistribution restriction enforcement'); else bad('redist');

const attr = createLicenseRecord({ class: 'permissive', redistribution: true, commercialUse: true, attributionRequired: true, attributionText: null });
if (!validateLicense(attr).ok) ok('attribution requirement preservation'); else bad('attr');

const reg = new ContentRegistry();
reg.add(fx.ok);
try { reg.add(JSON.parse(JSON.stringify(fx.ok))); bad('dup'); } catch (e) { if (e.code === 'DUPLICATE_CONTENT') ok('duplicate detection'); else bad(e.message); }
reg.quarantine(fx.ok.contentId, 'test');
if (reg.diagnoseMissing().length >= 1) ok('quarantine + missing diagnostics'); else bad('q');

const m1 = deterministicIngestManifest([fx.ok]);
const m2 = deterministicIngestManifest([fx.ok]);
if (m1.sha256 === m2.sha256) ok('SHA256/deterministic manifest'); else bad('manifest');

const dry = dryRunIngest([fx.ok, fx.missingLic]);
if (!dry.ok && dry.rejected.length === 1) ok('dry-run ingest'); else bad('dry');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uaos-lib18-'));
const tx = transactionalIngest([fx.ok], path.join(dir, 'stage'));
if (fs.existsSync(tx.stageFile)) ok('transactional staging'); else bad('stage');
rollbackIngest(path.join(dir, 'stage'));
if (!fs.existsSync(path.join(dir, 'stage'))) ok('rollback'); else bad('rb');

const ledger = exportLicenseLedger([fx.ok]);
if (ledger.entries[0].license.licenseId) ok('license ledger export'); else bad('ledger');
if (fx.ok.commercialReleaseGate.includes('BLOCKED')) ok('commercial gate blocked without real content'); else bad('gate');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'LIBRARY-V18-CONTENT-READINESS', failures: 0, realAudio: false }));
