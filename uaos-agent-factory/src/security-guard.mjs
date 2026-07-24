import { containsForbiddenCommand, pathLeakScan } from './lib.mjs';

const SECRET_PATTERNS = [
  /sk_live_[A-Za-z0-9]+/g,
  /sk_test_[A-Za-z0-9]+/g,
  /-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----/g,
  /AKIA[0-9A-Z]{16}/g,
  /password\s*=\s*['\"][^'\"]{8,}/gi
];

export function scanSecrets(text) {
  const hits = [];
  const s = String(text || '');
  for (const re of SECRET_PATTERNS) {
    const m = s.match(re);
    if (m) hits.push(...m.map((x) => x.slice(0, 12) + '…'));
  }
  return hits;
}

export function securityScanPayload(payload) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return {
    forbiddenCommands: containsForbiddenCommand(text),
    pathLeaks: pathLeakScan(text),
    secretHits: scanSecrets(text),
    ok:
      containsForbiddenCommand(text).length === 0 &&
      pathLeakScan(text).length === 0 &&
      scanSecrets(text).length === 0
  };
}

export function assertSafeCommands(commands) {
  const scan = securityScanPayload((commands || []).join('\n'));
  if (!scan.ok) {
    const err = new Error('Security guard blocked unsafe commands');
    err.scan = scan;
    throw err;
  }
  return scan;
}
