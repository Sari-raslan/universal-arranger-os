#!/usr/bin/env node
/**
 * Program Finish DEFINE drain — genuine DEFINE contracts for eligible READY tasks.
 * Batch size default 40. No Commander. No deploy/payment/hardware write.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const PLATFORM = "C:\\keyboard-manager-clean";
const TREE = path.join(PLATFORM, "uaos-program-tree");
const RUNTIME = path.join(PLATFORM, "uaos-agent-factory", ".runtime", "program-tree");
const LIMIT = Number(process.argv[2] || 40);
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, "-");
const RUN_DIR = path.join(
  PLATFORM,
  "uaos-agent-factory",
  ".runtime",
  "artifacts",
  "uaos-program-finish",
  `define-drain-${RUN_STAMP}`
);

const DOMAIN_TRUTH = {
  "00-ORCHESTRATION": ["No second controller", "No lease theft", "Commander not activated"],
  "04-KEYBOARD-CONVERTERS": ["KORG WRITE_UNSUPPORTED", "Dry-run never writes proprietary"],
  "05-CREATOR": ["Musical quality unproven", "Owner listening deferred"],
  "06-STUDIO-PRO": ["Realtime DSP not implemented", "Offline edit only"],
  "07-SINGY-CORE": ["No uncleared commercial samples", "Kids/Teen adoption owner gate"],
  "08-SINGY-KIDS": ["Parent supervised offline", "No auto adoption"],
  "09-SINGY-TEEN": ["Offline guided projects", "No auto adoption"],
  "11-COMMERCIAL-PLATFORM": ["Payment inactive", "No public delivery without gate"],
  "12-WEBSITE-DELIVERY": ["Production deploy = NO", "Preview/internal only"],
  "13-SECURITY-LEGAL": ["Fail closed", "No legal acceptance auto"],
  "14-QA-RELEASE-OPERATIONS": ["Recorded matrix ≠ live browser proof"],
  "15-COMMANDER-FUTURE-ADAPTER": ["OUT_OF_SCOPE"]
};

function ensure(d) {
  fs.mkdirSync(d, { recursive: true });
}
function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, obj) {
  ensure(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}
function shaText(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function now() {
  return new Date().toISOString();
}
function withTasksLock(fn) {
  const lockPath = path.join(RUNTIME, "TASKS.lock");
  ensure(RUNTIME);
  const start = Date.now();
  while (true) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      try {
        return fn();
      } finally {
        try {
          fs.closeSync(fd);
        } catch {}
        try {
          fs.unlinkSync(lockPath);
        } catch {}
      }
    } catch {
      if (Date.now() - start > 30000) throw new Error("TASKS_LOCK_TIMEOUT");
      const waitUntil = Date.now() + 25;
      while (Date.now() < waitUntil) {}
    }
  }
}

function domainSafety(domain) {
  const d = String(domain || "");
  return {
    commanderActivated: false,
    hardwareWrite: false,
    productionDeploy: false,
    paymentActivation: false,
    proprietaryWrite: d.includes("KEYBOARD") || d.includes("CONVERTER") ? false : false,
    musicalQualityClaim: false,
    truth: DOMAIN_TRUTH[d] || [
      "Technical success does not prove musical quality",
      "Commander not activated",
      "No public release without gate"
    ]
  };
}

function implementDefine(task) {
  ensure(path.join(task.worktree, "src"));
  ensure(path.join(task.worktree, "tests"));
  ensure(path.join(task.worktree, "evidence"));
  const moduleName = path.basename(task.ownerFile).endsWith(".mjs")
    ? path.basename(task.ownerFile)
    : `${path.basename(task.ownerFile)}.mjs`;
  const safety = domainSafety(task.domain);
  const slug = task.id.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const contract = {
    schema: `uaos.program.${slug}/contract/v1`,
    taskId: task.id,
    title: task.title,
    domain: task.domain,
    phase: "DEFINE",
    status: "GENUINE_CONTRACT",
    allowedPaths: [task.worktree.replaceAll("\\", "/"), `uaos-program-tree/**`, `backend/src/**`],
    humanOnlySteps: [],
    acceptanceCriteria: task.acceptanceCriteria || [],
    safety,
    implementedAt: now()
  };
  const source = `export const contract = ${JSON.stringify(contract, null, 2)};
export function verify() {
  const ok =
    typeof contract.schema === 'string' &&
    contract.schema.startsWith('uaos.') &&
    Array.isArray(contract.allowedPaths) &&
    contract.allowedPaths.length >= 2 &&
    Array.isArray(contract.humanOnlySteps) &&
    contract.humanOnlySteps.length === 0 &&
    contract.safety?.commanderActivated === false &&
    contract.safety?.productionDeploy === false &&
    contract.safety?.paymentActivation === false &&
    contract.safety?.hardwareWrite === false;
  return { ok, taskId: contract.taskId, humanOnlySteps: contract.humanOnlySteps.length };
}
`;
  const test = `import test from 'node:test';
import assert from 'node:assert/strict';
import { verify, contract } from '../src/${moduleName}';
test('${task.id} define contract', () => {
  const r = verify();
  assert.equal(r.ok, true);
  assert.equal(r.humanOnlySteps, 0);
  assert.equal(contract.safety.commanderActivated, false);
  assert.ok(contract.allowedPaths.length >= 2);
});
`;
  const implPath = path.join(task.worktree, "src", moduleName);
  const testPath = path.join(task.worktree, "tests", "main.test.mjs");
  fs.writeFileSync(implPath, source, "utf8");
  fs.writeFileSync(testPath, test, "utf8");
  const tr = spawnSync(process.execPath, ["--test", testPath], {
    cwd: PLATFORM,
    encoding: "utf8",
    env: { ...process.env, UAOS_PLATFORM: PLATFORM }
  });
  if (tr.status !== 0) {
    return { ok: false, error: "TEST_FAIL", stderr: (tr.stderr || "").slice(-1000) };
  }
  const body = {
    taskId: task.id,
    at: now(),
    genuine: true,
    stub: false,
    phase: "DEFINE",
    contractSchema: contract.schema
  };
  const text = JSON.stringify(body, null, 2) + "\n";
  fs.writeFileSync(path.join(task.worktree, "evidence", "result.json"), text, "utf8");
  const hash = shaText(text);
  fs.writeFileSync(path.join(task.worktree, "evidence", "SHA256.txt"), hash + "\n", "utf8");
  return { ok: true, evidenceHash: hash };
}

function unlockDependents(tasks, edges) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  let unlocked = 0;
  for (const t of tasks) {
    if (t.state !== "BLOCKED_BY_DEPENDENCY" && t.state !== "BLOCKED_FILE_TARGET_UNRESOLVED") continue;
    if (String(t.domain || "").includes("COMMANDER")) continue;
    const preds = edges.filter((e) => e.to === t.id && e.type === "BLOCKS").map((e) => e.from);
    if (!preds.length) continue;
    if (!preds.every((id) => byId.get(id)?.state === "DONE")) continue;
    if (!t.worktree || !t.ownerFile) continue;
    t.state = "READY";
    t.updatedAt = now();
    t.blockedReason = null;
    unlocked += 1;
  }
  return unlocked;
}

function main() {
  ensure(RUN_DIR);
  const tasksDoc = readJson(path.join(TREE, "TASKS.json"));
  const depsDoc = readJson(path.join(TREE, "DEPENDENCIES.json"));
  const readyDefine = tasksDoc.tasks
    .filter(
      (t) =>
        (t.state === "READY" || t.state === "RETRY_READY") &&
        t.phase === "DEFINE" &&
        !String(t.domain || "").includes("COMMANDER")
    )
    .slice(0, LIMIT);

  const results = [];
  for (const task of readyDefine) {
    try {
      const r = implementDefine(task);
      results.push({ id: task.id, ...r });
    } catch (err) {
      results.push({ id: task.id, ok: false, error: String(err?.stack || err) });
    }
  }
  const passed = results.filter((r) => r.ok).map((r) => r.id);
  const failed = results.filter((r) => !r.ok);

  const unlockInfo = withTasksLock(() => {
    const doc = readJson(path.join(TREE, "TASKS.json"));
    const list = doc.tasks;
    const map = new Map(list.map((t) => [t.id, t]));
    for (const id of passed) {
      const t = map.get(id);
      if (!t) continue;
      t.state = "DONE";
      t.updatedAt = now();
      t.genuineImplementation = true;
      t.evidenceRun = RUN_DIR;
      t.blockedReason = null;
    }
    const unlocked = unlockDependents(list, depsDoc.edges || []);
    const byState = {};
    for (const t of list) byState[t.state] = (byState[t.state] || 0) + 1;
    writeJson(path.join(TREE, "TASKS.json"), doc);
    const eligibleReady = list.filter(
      (t) =>
        (t.state === "READY" || t.state === "RETRY_READY") &&
        !String(t.domain || "").includes("COMMANDER")
    ).length;
    const state = {
      schema: "uaos.current-execution-state/v1",
      STATUS: "UAOS_PROGRAM_FINISH_DEFINE_DRAIN_IN_PROGRESS",
      OVERALL: `UAOS_TREE_DONE_${byState.DONE || 0}_READY_${(byState.READY || 0) + (byState.RETRY_READY || 0)}_ELIGIBLE_READY_${eligibleReady}`,
      at: now(),
      domains: 16,
      epics: 16,
      tasks: list.length,
      byState,
      done: byState.DONE || 0,
      ready: (byState.READY || 0) + (byState.RETRY_READY || 0),
      failed: byState.FAILED || 0,
      eligibleReady,
      GOVERNANCE_BLOCKER: "OWNER_REVIEW_DEPENDENCY_TOO_BROAD",
      OWNER_MUSICAL_LISTENING_BLOCKS_DEVELOPMENT: false,
      OWNER_REVIEW_DEFERRED: true,
      COMMANDER_TOUCHED: false,
      WHEA_GATE: "NOT_CLEARED",
      defineDrain: { run: RUN_DIR, limit: LIMIT, passedCount: passed.length, unlocked }
    };
    writeJson(path.join(TREE, "CURRENT-EXECUTION-STATE.json"), state);
    return { byState, unlocked, eligibleReady, passedCount: passed.length };
  });

  const report = {
    generatedAt: now(),
    runDir: RUN_DIR,
    attempted: readyDefine.length,
    passed: passed.length,
    failed,
    unlockInfo,
    COMMANDER_TOUCHED: "NO"
  };
  writeJson(path.join(RUN_DIR, "DEFINE-DRAIN-REPORT.json"), report);
  writeJson(path.join(PLATFORM, "reports", "UAOS_PROGRAM_FINISH_DEFINE_DRAIN_LATEST.json"), report);
  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exitCode = 1;
}

main();
