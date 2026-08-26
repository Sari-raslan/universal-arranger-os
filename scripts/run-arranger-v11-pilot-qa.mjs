/**
 * V11 pilot package QA — run after assembly.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "release-candidates", "UAOS-ARRANGER-STUDIO-EARLY-ACCESS-V11");
const node = path.join(ROOT, "RUNTIME", "node", "node.exe");
const skuImport = pathToFileURL(path.join(ROOT, "PRODUCT", "backend", "src", "sku", "arrangerStudioSku.js")).href;

function runSkuExpr(expr) {
  const safeCode = `import(${JSON.stringify(skuImport)}).then(m=>{ console.log(JSON.stringify(${expr})); }).catch(e=>{ console.error(e.message); process.exit(1); });`;
  const r = spawnSync(node, ["--input-type=module", "-e", safeCode], { cwd: ROOT, encoding: "utf8", timeout: 60000 });
  const line = (r.stdout || "").trim().split("\n").filter(Boolean).pop();
  if (r.status !== 0 || !line) throw new Error(r.stderr || r.stdout || "SKU call failed");
  return JSON.parse(line);
}

const wf = runSkuExpr("m.runAllCustomerWorkflows()");
const clean = runSkuExpr("m.runCleanInstallEquivalent()");

const trials = [];
for (let i = 0; i < 5; i++) {
  const t0 = Date.now();
  const demo = runSkuExpr('m.openDemoProject("demo-01-chords-arrangement")');
  trials.push({ trial: i + 1, ok: demo.ok, seconds: Number(((Date.now() - t0) / 1000).toFixed(2)) });
}
const okTimes = trials.filter((t) => t.ok).map((t) => t.seconds).sort((a, b) => a - b);
const median = okTimes.length ? okTimes[Math.floor(okTimes.length / 2)] : null;

const result = {
  workflows: { pass: wf.pass, total: wf.total, p0: wf.p0, p1: wf.p1 },
  cleanInstall: clean,
  trials,
  TIME_TO_FIRST_RESULT_MEDIAN: median,
  checks: {
    BUNDLED_NODE: fs.existsSync(node),
    LAUNCH_BAT: fs.existsSync(path.join(ROOT, "START-UAOS-ARRANGER-STUDIO.bat")),
    WORKFLOWS_PASS: wf.pass === 20,
    P0: wf.p0,
    P1: wf.p1,
    CLEAN_INSTALL: clean.ok === true,
    TIME_TARGET_MET: median !== null && median <= 5
  }
};
console.log(JSON.stringify(result, null, 2));
const ok = result.checks.WORKFLOWS_PASS && result.checks.P0 === 0 && result.checks.CLEAN_INSTALL && result.checks.TIME_TARGET_MET;
process.exit(ok ? 0 : 1);
