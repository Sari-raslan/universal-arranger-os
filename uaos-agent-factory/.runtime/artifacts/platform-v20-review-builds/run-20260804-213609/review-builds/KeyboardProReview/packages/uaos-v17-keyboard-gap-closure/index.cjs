'use strict';
/**
 * Keyboard V17 — technical gap closure (no hardware/KORG writers)
 */
const BANNED = ['Real KORG Writer', 'USB', 'SysEx', 'hardware writers', '.STY writing', '.SET writing', '.PRS writing', '.PRF writing', '.KST writing'];

const GAP_CLASSIFICATION = [
  { id: 'converters-separate-lane', text: 'Keyboard Converters completed in separate lane', class: 'ALREADY_CLOSED' },
  { id: 'hardware-banned', text: 'hardware/KORG/USB/SysEx remain banned', class: 'OUT_OF_SCOPE' },
  { id: 'not-commercial-hw', text: 'not commercial hardware-ready', class: 'COMMERCIAL_POLICY_REQUIRED' },
  { id: 'owner-adoption', text: 'owner adoption approval required', class: 'OWNER_APPROVAL_REQUIRED' },
  { id: 'ban-enforcement-registry', text: 'ban enforcement capability registry', class: 'TECHNICAL_SAFE_TO_CLOSE' },
  { id: 'package-boundary-check', text: 'package boundary documentation check', class: 'TECHNICAL_SAFE_TO_CLOSE' },
  { id: 'safe-export-guard', text: 'safe export guard (no proprietary write)', class: 'TECHNICAL_SAFE_TO_CLOSE' }
];

function assertBanned(capability) {
  if (BANNED.some((b) => String(capability).toLowerCase().includes(b.toLowerCase().split(' ')[0]) && /writer|usb|sysex|hardware|\.sty|\.set|\.prs|\.prf|\.kst/i.test(capability))) {
    return { allowed: false, reason: 'BANNED_CAPABILITY' };
  }
  const blocked = ['korg.writer', 'usb.write', 'sysex.send', 'sty.write', 'set.write', 'prs.write', 'prf.write', 'kst.write'];
  if (blocked.includes(String(capability))) return { allowed: false, reason: 'BANNED_CAPABILITY' };
  return { allowed: true };
}

function packageBoundaryCheck(pkg = {}) {
  const errors = [];
  if (pkg.claimsCommercialHardwareReady) errors.push('COMMERCIAL_HARDWARE_CLAIM_FORBIDDEN');
  if (pkg.includesKorgWriter) errors.push('KORG_WRITER_FORBIDDEN');
  return { ok: errors.length === 0, errors };
}

function safeExportGuard(plan = {}) {
  if (plan.inPlace) return { ok: false, error: 'IN_PLACE_FORBIDDEN' };
  if (plan.target === 'korg' || plan.proprietaryWriter) return { ok: false, error: 'PROPRIETARY_WRITE_FORBIDDEN' };
  if (!plan.outputDir) return { ok: false, error: 'OUTPUT_DIR_REQUIRED' };
  return { ok: true, mode: 'new-directory-only' };
}

module.exports = { BANNED, GAP_CLASSIFICATION, assertBanned, packageBoundaryCheck, safeExportGuard };
