'use strict';
/**
 * Keyboard V18 — Format Contract Hardening (inspect-only for proprietary)
 */
const crypto = require('crypto');

const FAMILIES = {
  'uaos.project': { extensions: ['.uaos.json'], write: true, read: true, inspect: true },
  'uaos.arranger.set': { extensions: ['.arrset.json'], write: true, read: true, inspect: true },
  midi: { extensions: ['.mid', '.midi'], write: false, read: true, inspect: true },
  'korg.sty': { extensions: ['.sty'], write: false, read: false, inspect: true, status: 'INSPECT_ONLY', ownerContract: 'OWNER_FORMAT_CONTRACT_REQUIRED' },
  'korg.set': { extensions: ['.set'], write: false, read: false, inspect: true, status: 'WRITE_UNSUPPORTED', ownerContract: 'OWNER_FORMAT_CONTRACT_REQUIRED' },
  'korg.prs': { extensions: ['.prs'], write: false, read: false, inspect: true, status: 'WRITE_UNSUPPORTED', ownerContract: 'OWNER_FORMAT_CONTRACT_REQUIRED' },
  'korg.prf': { extensions: ['.prf'], write: false, read: false, inspect: true, status: 'WRITE_UNSUPPORTED', ownerContract: 'OWNER_FORMAT_CONTRACT_REQUIRED' },
  'korg.kst': { extensions: ['.kst'], write: false, read: false, inspect: true, status: 'WRITE_UNSUPPORTED', ownerContract: 'OWNER_FORMAT_CONTRACT_REQUIRED' }
};

const SIGNATURES = {
  midi: Buffer.from([0x4d, 0x54, 0x68, 0x64]), // MThd
  'uaos.project': Buffer.from('{"schemaVersion":"uaos')
};

const LIMITS = { maxBytes: 5 * 1024 * 1024, maxNestedDepth: 8, timeoutMs: 2000 };

function detectFormat(buf, { filename = '' } = {}) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf || '');
  if (buf.length === 0) return { formatId: null, error: 'EMPTY', diagnostics: ['empty input'] };
  if (buf.length > LIMITS.maxBytes) return { formatId: null, error: 'OVERSIZED', diagnostics: ['exceeds safe size limit'] };
  const ext = (filename.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  if (buf.slice(0, 4).equals(SIGNATURES.midi)) return capabilityResult('midi', { signature: 'MThd', extension: ext });
  const head = buf.slice(0, Math.min(64, buf.length)).toString('utf8');
  if (head.includes('uaos.project') || head.includes('uaos.arranger')) {
    const id = head.includes('arranger') ? 'uaos.arranger.set' : 'uaos.project';
    return capabilityResult(id, { signature: 'json-uaos', extension: ext });
  }
  for (const [id, meta] of Object.entries(FAMILIES)) {
    if (meta.extensions.includes(ext)) return capabilityResult(id, { signature: 'extension-only', extension: ext, warning: 'signature-unverified' });
  }
  return { formatId: 'unknown', error: 'UNKNOWN_FORMAT', diagnostics: ['no signature/extension match'], capabilities: null };
}

function capabilityResult(formatId, extra = {}) {
  const fam = FAMILIES[formatId];
  return {
    formatId,
    family: formatId,
    version: extra.version || null,
    endianness: extra.endianness || 'n/a',
    diagnostics: [],
    capabilities: {
      read: !!fam.read,
      write: !!fam.write,
      inspect: !!fam.inspect,
      status: fam.status || (fam.write ? 'READ_WRITE' : fam.read ? 'READ_ONLY' : 'INSPECT_ONLY'),
      ownerContract: fam.ownerContract || null,
      conversionEligible: !!fam.write || formatId.startsWith('uaos.')
    },
    ...extra
  };
}

function inspectBuffer(buf, opts = {}) {
  const started = Date.now();
  const det = detectFormat(buf, opts);
  if (Date.now() - started > LIMITS.timeoutMs) det.diagnostics.push('timeout-contract-exceeded');
  if (opts.expectTruncated) det.diagnostics.push('truncated');
  if (opts.corrupted) { det.error = det.error || 'CORRUPTED'; det.diagnostics.push('corruption-reported'); }
  if (opts.nestedDepth > LIMITS.maxNestedDepth) {
    det.error = 'NESTED_DEPTH_LIMIT';
    det.diagnostics.push('nested-depth-limit');
  }
  if (opts.versionMismatch) {
    det.error = 'VERSION_MISMATCH';
    det.diagnostics.push('unknown-or-mismatched-version');
  }
  det.deterministicId = crypto.createHash('sha256').update(Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf))).digest('hex').slice(0, 16);
  return det;
}

function enforceWrite(formatId) {
  const fam = FAMILIES[formatId];
  if (!fam || !fam.write) return { allowed: false, reason: fam?.status || 'WRITE_UNSUPPORTED' };
  return { allowed: true };
}

module.exports = { FAMILIES, SIGNATURES, LIMITS, detectFormat, inspectBuffer, enforceWrite, capabilityResult };
