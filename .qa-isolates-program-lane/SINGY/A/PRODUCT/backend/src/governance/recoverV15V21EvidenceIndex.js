/**
 * Recover V15–V21 evidence index (read-only prior worktrees).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const EXPECTED_V21_SHA =
  "5F5C44C1AE9669269A0F55623768D5855850FA931F60B76BCA7F84448FE878B6";

const PROTECTED = [
  "platform-v15-execution",
  "platform-v16-execution",
  "platform-v17-execution",
  "platform-v18-execution",
  "platform-v19-integration",
  "platform-v20-review",
  "platform-v21-execution"
];

function shaFile(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").toUpperCase();
}

export function recoverV15V21EvidenceIndex({
  platformRoot = process.cwd(),
  worktreesRoot = "C:\\UAOS_AGENT_FACTORY_WORKTREES"
} = {}) {
  const zip = path.join(
    platformRoot,
    "uaos-agent-factory",
    ".runtime",
    "artifacts",
    "platform-v21-owner-review-offline-render",
    "run-20260804-215604",
    "UAOS-V21-EVIDENCE-20260804-215604.zip"
  );
  const v21 = {
    zip,
    exists: fs.existsSync(zip),
    sha256Expected: EXPECTED_V21_SHA,
    sha256Actual: null,
    match: false
  };
  if (v21.exists) {
    v21.sha256Actual = shaFile(zip);
    v21.match = v21.sha256Actual === EXPECTED_V21_SHA;
  }
  const priorWorktrees = PROTECTED.map((name) => {
    const p = path.join(worktreesRoot, name);
    return { name, path: p, exists: fs.existsSync(p), readOnlyPolicy: true };
  });
  return {
    schema: "uaos.orchestration.v15-v21-evidence-index/v1",
    ok: true,
    recoveredAt: new Date().toISOString(),
    v21,
    priorWorktrees,
    writeToProtectedDenied: true,
    commanderTouched: false
  };
}
