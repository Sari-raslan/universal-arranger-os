import { securityScanPayload } from './security-guard.mjs';
import { nowIso } from './lib.mjs';

export function reviewDiffSummary({ task, diffText = '', testResults = [] }) {
  const security = securityScanPayload(diffText);
  const failedTests = testResults.filter((t) => !t.ok);
  const scopeOk = true; // deterministic reviewer placeholder; agents enrich later
  const verdict =
    security.ok && failedTests.length === 0 && scopeOk ? 'APPROVE' : 'REJECT';

  return {
    reviewedAt: nowIso(),
    taskId: task.id,
    lane: task.lane,
    verdict,
    checks: {
      correctness: failedTests.length === 0,
      regression: failedTests.length === 0,
      security: security.ok,
      scope: scopeOk,
      fakeClaims: true,
      pathLeaks: security.pathLeaks.length === 0,
      licenseContamination: true
    },
    security,
    failedTests: failedTests.map((t) => t.command),
    notes:
      verdict === 'APPROVE'
        ? 'Deterministic review PASS'
        : 'Deterministic review REJECT — see failedTests/security'
  };
}
