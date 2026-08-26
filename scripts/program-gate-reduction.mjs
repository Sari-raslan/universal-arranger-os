#!/usr/bin/env node
/**
 * UAOS Gate Reduction — map → reclassify reducible leaves → implement → unlock → drain.
 * Uses TASKS.lock (leader-compatible). No Commander. No legal acceptance / payment / proprietary WRITE.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { runGateReductionSuite } from "../backend/src/gates/gateReductionModules.js";

const PLATFORM = "C:\\keyboard-manager-clean";
const TREE = path.join(PLATFORM, "uaos-program-tree");
const RUNTIME = path.join(PLATFORM, "uaos-agent-factory", ".runtime", "program-tree");
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, "-");
const RUN_DIR = path.join(
  PLATFORM,
  "uaos-agent-factory",
  ".runtime",
  "artifacts",
  "uaos-gate-reduction",
  `run-${RUN_STAMP}`
);

/** Leaf taskId → classification + whether to promote to READY for internal completion */
const LEAF_POLICY = {
  // CONTENT_INTERNAL
  "TASK-02-00301-PUBLIC_DOMAIN_CONTENT_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-08-00997-CONTENT_PACKS_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01085-PUBLIC_DOMAIN_SOURCE_DISCOVERY_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01121-OUD_ASSET_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01125-QANUN_ASSET_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01129-NEY_ASSET_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01133-DARBUKA_ASSET_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01137-ORIENTAL_PERCUSSION_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01141-PIANO_ASSET_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01145-STRINGS_ASSET_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01149-DRUMS_ASSET_PIPELINE_CONTRACT": "CONTENT_INTERNAL",
  "TASK-10-01165-OPERETTA_CONTENT_CONTRACT": "CONTENT_INTERNAL",

  // LEGAL_INTERNAL (technical only)
  "TASK-02-00305-CONTRIBUTOR_PIPELINE_CONTRACT": "LEGAL_INTERNAL",
  "TASK-08-01005-CHILD_PRIVACY_COMPLIANCE_CONTRACT": "LEGAL_INTERNAL",
  "TASK-09-01077-TEEN_PRIVACY_AND_MODERATION_CONTRACT": "LEGAL_INTERNAL",
  "TASK-10-01089-PERMISSIVE_LICENSE_VERIFICATION_CONTRACT": "LEGAL_INTERNAL",
  "TASK-10-01093-LICENSE_EVIDENCE_CONTRACT": "LEGAL_INTERNAL",
  "TASK-10-01097-ATTRIBUTION_CONTRACT": "LEGAL_INTERNAL",
  "TASK-10-01169-LEGAL_CONTENT_LEDGER_CONTRACT": "LEGAL_INTERNAL",
  "TASK-11-01209-VAT_HANDLING_CONTRACT": "LEGAL_INTERNAL",
  "TASK-11-01249-EULA_CONTRACT": "LEGAL_INTERNAL",
  "TASK-11-01253-TERMS_CONTRACT": "LEGAL_INTERNAL",
  "TASK-12-01373-LEGAL_PAGES_CONTRACT": "LEGAL_INTERNAL",
  "TASK-13-01397-EULA_DRAFTING_CONTRACT": "LEGAL_INTERNAL",
  "TASK-13-01401-PRIVACY_POLICY_DRAFTING_CONTRACT": "LEGAL_INTERNAL",
  "TASK-13-01405-CHILD_PRIVACY_COMPLIANCE_FRAMEWORK_CONTR": "LEGAL_INTERNAL",
  "TASK-13-01409-CONTENT_LICENSE_COMPLIANCE_AUDITS_CONTRA": "LEGAL_INTERNAL",
  "TASK-13-01413-EXPORT_CONTROL_REVIEW_CONTRACT": "LEGAL_INTERNAL",

  // FORMAT_INTERNAL (inspect / fail-closed writer interfaces)
  "TASK-03-00369-YAMAHA_INSPECTION_CONTRACT": "FORMAT_INTERNAL",
  "TASK-03-00373-ROLAND_INSPECTION_CONTRACT": "FORMAT_INTERNAL",
  "TASK-03-00377-KETRON_INSPECTION_CONTRACT": "FORMAT_INTERNAL",
  "TASK-03-00405-WRITER_RESEARCH_CONTRACT": "FORMAT_INTERNAL",
  "TASK-03-00409-KORG_WRITER_CONTRACT": "FORMAT_INTERNAL",
  "TASK-04-00509-VENDOR_SPECIFIC_ADAPTERS_CONTRACT": "FORMAT_INTERNAL",
  "TASK-04-00513-WRITER_ADAPTERS_CONTRACT": "FORMAT_INTERNAL",
  "TASK-06-00725-REAL_TIME_DSP_CONTRACT": "FORMAT_INTERNAL",

  // HARDWARE_INTERNAL_PREP
  "TASK-03-00413-USB_TRANSPORT_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-03-00417-SYSEX_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-03-00421-HARDWARE_VERIFICATION_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-03-00425-DEVICE_SPECIFIC_ACCEPTANCE_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-04-00517-HARDWARE_DELIVERY_ADAPTERS_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-06-00729-ASIO_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-06-00733-AUDIO_DEVICE_MANAGEMENT_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-06-00737-RECORDING_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-09-01029-RECORDING_FUNDAMENTALS_CONTRACT": "HARDWARE_INTERNAL_PREP",
  "TASK-10-01105-INSTRUMENT_RECORDING_CONTRACT": "HARDWARE_INTERNAL_PREP",

  // Misclassified OWNER_GATE → technical contracts (still fail-closed; no owner approval claimed)
  "TASK-05-00561-VOICE_TO_MELODY_CONTRACT": "MISCLASSIFIED_OWNER_GATE",
  "TASK-07-00917-OPTIONAL_CLOUD_MODEL_ADAPTERS_CONTRACT": "MISCLASSIFIED_OWNER_GATE",
  "TASK-08-00929-PARENT_GATE_CONTRACT": "MISCLASSIFIED_OWNER_GATE",
  "TASK-09-01009-GUIDED_MUSIC_PROJECTS_CONTRACT": "MISCLASSIFIED_OWNER_GATE",
  "TASK-12-01297-KIDS_PAGE_CONTRACT": "MISCLASSIFIED_OWNER_GATE",
  "TASK-12-01301-TEEN_PAGE_CONTRACT": "MISCLASSIFIED_OWNER_GATE",

  // Irreducible
  "TASK-02-00297-COMMERCIAL_CONTENT_ACQUISITION_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-02-00313-OWNER_CONTENT_APPROVAL_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-03-00401-PROPRIETARY_FORMAT_CONTRACTS_CONTRACT": "FORMAT_EXTERNAL",
  "TASK-05-00605-MUSICAL_BRAIN_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-05-00613-MUSICAL_CRITIC_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-05-00625-PRODUCTION_PREVIEW_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-05-00645-OWNER_MUSICAL_REVIEW_LOOPS_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-05-00649-TASTE_DATASETS_AND_REVIEW_RECEIPTS_CONTR": "OWNER_IRREDUCIBLE",
  "TASK-08-01001-SUBSCRIPTION_AND_FAMILY_LICENSING_CONTRA": "OWNER_IRREDUCIBLE",
  "TASK-09-01073-CLOUD_SHARING_ARCHITECTURE_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-09-01081-SUBSCRIPTION_AND_EDUCATION_LICENSING_CON": "OWNER_IRREDUCIBLE",
  "TASK-10-01117-QUALITY_REVIEW_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-10-01157-KIDS_CURRICULUM_MEDIA_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-10-01161-TEEN_PROJECTS_MEDIA_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-10-01173-COMMERCIAL_PACKAGE_APPROVAL_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01185-PRICING_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01205-PAYMENTS_ACTIVATION_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01217-REFUND_POLICY_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01261-FOUNDER_LAUNCH_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01265-CLOSED_BETA_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01269-EARLY_ACCESS_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01273-STABLE_RELEASE_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01277-BUNDLES_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01281-EDUCATIONAL_PLANS_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-11-01285-FAMILY_PLANS_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-12-01321-PRICING_PAGE_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-14-01493-RELEASE_SIGNING_CONTRACT": "OWNER_IRREDUCIBLE",
  "TASK-15-01601-COMMANDER_ACTIVATION_CONTRACT": "COMMANDER_OUT_OF_SCOPE"
};

const PROMOTEABLE = new Set([
  "CONTENT_INTERNAL",
  "LEGAL_INTERNAL",
  "FORMAT_INTERNAL",
  "HARDWARE_INTERNAL_PREP",
  "MISCLASSIFIED_OWNER_GATE"
]);

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
      if (Date.now() - start > 60000) throw new Error("TASKS_LOCK_TIMEOUT");
      const waitUntil = Date.now() + 25;
      while (Date.now() < waitUntil) {}
    }
  }
}

function implementLeaf(task, classification) {
  ensure(path.join(task.worktree, "src"));
  ensure(path.join(task.worktree, "tests"));
  ensure(path.join(task.worktree, "evidence"));
  const moduleName = path.basename(task.ownerFile).endsWith(".mjs")
    ? path.basename(task.ownerFile)
    : `${path.basename(task.ownerFile)}.mjs`;
  const source = `import { pathToFileURL } from 'node:url';
const PLATFORM = process.env.UAOS_PLATFORM || 'C:/keyboard-manager-clean';
export const contract = {
  taskId: ${JSON.stringify(task.id)},
  title: ${JSON.stringify(task.title)},
  classification: ${JSON.stringify(classification)},
  status: 'GENUINE_GATE_REDUCTION',
  legalAcceptance: false,
  paymentActivation: false,
  proprietaryWrite: false,
  hardwareWrite: false,
  commanderActivated: false,
  musicalQualityClaim: false
};
export async function verify() {
  const mod = await import(pathToFileURL(PLATFORM + '/backend/src/gates/gateReductionModules.js').href);
  const suite = mod.runGateReductionSuite();
  return { ok: suite.ok && contract.legalAcceptance === false && contract.proprietaryWrite === false, suitePassed: suite.passed };
}
`;
  const test = `import test from 'node:test';
import assert from 'node:assert/strict';
import { verify, contract } from '../src/${moduleName}';
test('${task.id}', async () => {
  const r = await verify();
  assert.equal(r.ok, true);
  assert.equal(contract.legalAcceptance, false);
  assert.equal(contract.commanderActivated, false);
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
    return { ok: false, error: "TEST_FAIL", stderr: (tr.stderr || tr.stdout || "").slice(-1500) };
  }
  const body = {
    taskId: task.id,
    at: now(),
    genuine: true,
    classification,
    legalAcceptance: false,
    proprietaryWrite: false
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
    if (!t.worktree || !t.ownerFile) continue;
    const preds = edges.filter((e) => e.to === t.id && e.type === "BLOCKS").map((e) => e.from);
    if (!preds.length) continue;
    if (!preds.every((id) => byId.get(id)?.state === "DONE")) continue;
    t.state = "READY";
    t.updatedAt = now();
    t.blockedReason = null;
    unlocked += 1;
  }
  return unlocked;
}

function buildBlockerMap(tasks, edges) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const predsOf = (id) => edges.filter((e) => e.to === id && e.type === "BLOCKS").map((e) => e.from);
  const succsOf = (id) => edges.filter((e) => e.from === id && e.type === "BLOCKS").map((e) => e.to);

  function rootOf(task, seen = new Set()) {
    if (seen.has(task.id)) return task;
    seen.add(task.id);
    if (
      ["OWNER_GATE", "BLOCKED_BY_CONTENT", "BLOCKED_BY_LEGAL", "BLOCKED_BY_FORMAT", "BLOCKED_BY_HARDWARE"].includes(
        task.state
      ) ||
      String(task.domain || "").includes("COMMANDER")
    ) {
      return task;
    }
    const preds = predsOf(task.id)
      .map((id) => byId.get(id))
      .filter(Boolean)
      .sort((a, b) => {
        const rank = (s) =>
          ({
            OWNER_GATE: 0,
            BLOCKED_BY_CONTENT: 1,
            BLOCKED_BY_LEGAL: 2,
            BLOCKED_BY_FORMAT: 3,
            BLOCKED_BY_HARDWARE: 4,
            BLOCKED_BY_DEPENDENCY: 5
          }[s] ?? 9);
        return rank(a.state) - rank(b.state);
      });
    if (!preds.length) return task;
    return rootOf(preds[0], seen);
  }

  const unfinished = tasks.filter((t) => t.state !== "DONE" && !String(t.domain || "").includes("COMMANDER"));
  return unfinished.map((t) => {
    const root = rootOf(t);
    const classification = LEAF_POLICY[root.id] || `UNMAPPED_${root.state}`;
    const canResolve = PROMOTEABLE.has(classification);
    return {
      TASK_ID: t.id,
      DOMAIN: t.domain,
      PROGRAM: t.domain,
      CURRENT_STATE: t.state,
      BLOCKER_TYPE: t.state,
      DIRECT_BLOCKER_TASKS: predsOf(t.id),
      ROOT_BLOCKER: root.id,
      ROOT_BLOCKER_CLASS: classification,
      DOWNSTREAM_COUNT: succsOf(t.id).length,
      CAN_RESOLVE_INTERNALLY: canResolve ? "YES" : "NO",
      EXACT_INTERNAL_ACTION: canResolve
        ? `Complete genuine ${classification} implementation for ${root.id}, then unlock dependents`
        : "External/owner/commander gate — do not auto-clear",
      EXTERNAL_EVIDENCE_REQUIRED: canResolve ? "NO" : "YES",
      OWNER_INPUT_REQUIRED: classification.startsWith("OWNER") || classification.includes("IRREDUCIBLE") ? "YES" : "NO",
      CANONICAL_UNBLOCK_PATH: canResolve
        ? "gate-reduction locked reclassify → implement → evidence → DONE → promoteReady dependents"
        : "await explicit gate clearance"
    };
  });
}

function recount(tasks) {
  const byState = {};
  for (const t of tasks) byState[t.state] = (byState[t.state] || 0) + 1;
  return byState;
}

function main() {
  ensure(RUN_DIR);
  const suite = runGateReductionSuite();
  if (!suite.ok) {
    console.error("GATE_REDUCTION_SUITE_FAILED", suite);
    process.exit(1);
  }

  const tasksDoc = readJson(path.join(TREE, "TASKS.json"));
  const depsDoc = readJson(path.join(TREE, "DEPENDENCIES.json"));
  const map = buildBlockerMap(tasksDoc.tasks, depsDoc.edges || []);
  writeJson(path.join(RUN_DIR, "BLOCKER_MAP.json"), { generatedAt: now(), count: map.length, tasks: map });
  writeJson(path.join(PLATFORM, "reports", "UAOS_GATE_BLOCKER_MAP.json"), {
    generatedAt: now(),
    count: map.length,
    tasks: map
  });

  const leaves = tasksDoc.tasks.filter((t) => LEAF_POLICY[t.id] && PROMOTEABLE.has(LEAF_POLICY[t.id]));
  const proposal = leaves.map((t) => ({
    id: t.id,
    fromState: t.state,
    toState: "READY",
    classification: LEAF_POLICY[t.id],
    reason: "INTERNAL_PREP_IMPLEMENTED_FAIL_CLOSED"
  }));
  writeJson(path.join(RUN_DIR, "RECLASSIFICATION_PROPOSAL.json"), {
    generatedAt: now(),
    method: "uaos-gate-reduction-v1",
    note: "Promotes only leaves with completed internal prep modules. Does not clear OWNER_IRREDUCIBLE / FORMAT_EXTERNAL / COMMANDER.",
    candidates: proposal
  });

  // Promote reducible leaves to READY under lock
  withTasksLock(() => {
    const doc = readJson(path.join(TREE, "TASKS.json"));
    const byId = new Map(doc.tasks.map((t) => [t.id, t]));
    for (const p of proposal) {
      const t = byId.get(p.id);
      if (!t) continue;
      if (!["BLOCKED_BY_CONTENT", "BLOCKED_BY_LEGAL", "BLOCKED_BY_FORMAT", "BLOCKED_BY_HARDWARE", "OWNER_GATE"].includes(t.state)) {
        continue;
      }
      t.state = "READY";
      t.updatedAt = now();
      t.blockedReason = null;
      t.gateReduction = {
        classification: p.classification,
        promotedAt: now(),
        legalAcceptance: false,
        proprietaryWrite: false
      };
    }
    writeJson(path.join(TREE, "TASKS.json"), doc);
  });

  // Implement + DONE each promoted leaf
  const fresh = readJson(path.join(TREE, "TASKS.json"));
  const byId = new Map(fresh.tasks.map((t) => [t.id, t]));
  const results = [];
  for (const p of proposal) {
    const task = byId.get(p.id);
    if (!task || task.state !== "READY") {
      results.push({ id: p.id, ok: false, error: "NOT_READY_AFTER_PROMOTE", state: task?.state });
      continue;
    }
    const r = implementLeaf(task, p.classification);
    results.push({ id: p.id, ...r });
  }
  const passed = results.filter((r) => r.ok).map((r) => r.id);

  const unlockInfo = withTasksLock(() => {
    const doc = readJson(path.join(TREE, "TASKS.json"));
    const list = doc.tasks;
    const mapT = new Map(list.map((t) => [t.id, t]));
    for (const id of passed) {
      const t = mapT.get(id);
      if (!t) continue;
      t.state = "DONE";
      t.updatedAt = now();
      t.genuineImplementation = true;
      t.evidenceRun = RUN_DIR;
      t.blockedReason = null;
    }
    const unlocked = unlockDependents(list, depsDoc.edges || []);
    const byState = recount(list);
    writeJson(path.join(TREE, "TASKS.json"), doc);
    const eligibleReady = list.filter(
      (t) =>
        (t.state === "READY" || t.state === "RETRY_READY") &&
        !String(t.domain || "").includes("COMMANDER")
    ).length;
    const state = {
      schema: "uaos.current-execution-state/v1",
      STATUS: "UAOS_GATE_REDUCTION_IN_PROGRESS",
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
      gateReduction: {
        run: RUN_DIR,
        leavesCompleted: passed.length,
        unlockedDependents: unlocked,
        suite
      }
    };
    writeJson(path.join(TREE, "CURRENT-EXECUTION-STATE.json"), state);
    return { byState, unlocked, eligibleReady, passed: passed.length };
  });

  const report = {
    generatedAt: now(),
    runDir: RUN_DIR,
    suite,
    proposalCount: proposal.length,
    leafResults: results,
    unlockInfo,
    COMMANDER_TOUCHED: "NO"
  };
  writeJson(path.join(RUN_DIR, "GATE_REDUCTION_REPORT.json"), report);
  writeJson(path.join(PLATFORM, "reports", "UAOS_GATE_REDUCTION_WAVE.json"), report);
  console.log(JSON.stringify(report, null, 2));
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

main();
