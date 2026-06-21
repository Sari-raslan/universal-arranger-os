import { spawnSync } from "node:child_process";

const scripts = [
  "scripts/qa/verify-full-local-product-gate-v1.mjs",
  "scripts/qa/uaos-local-health-check.mjs"
];

const results = [];

for (const script of scripts) {
  const r = spawnSync(process.execPath, [script], { encoding: "utf8" });
  results.push({
    script,
    pass: r.status === 0,
    status: r.status === 0 ? "pass" : "fail",
    stdoutTail: String(r.stdout || "").split(/\r?\n/).slice(-8),
    stderrTail: String(r.stderr || "").split(/\r?\n/).slice(-8)
  });
}

const out = {
  format: "UAOS_ALL_LOCAL_QA_RESULT",
  version: "1.0.0-safe-repair",
  total: results.length,
  passCount: results.filter(r => r.pass).length,
  failCount: results.filter(r => !r.pass).length,
  results
};

console.log(JSON.stringify(out, null, 2));
if (out.failCount > 0) process.exit(1);
