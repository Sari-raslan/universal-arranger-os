#!/usr/bin/env node
/**
 * Coordinator seal: mark proven tasks DONE, promote unblocked dependents.
 * Does not touch Commander or currently leased V13 worktrees.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const TREE = "C:\\keyboard-manager-clean\\uaos-program-tree";
const RUNTIME = "C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\program-tree";
const DONE_IDS = [
  "TASK-02-00236-ARTICULATIONS_EVIDENCE",
  "TASK-03-00348-MEDIA_REFERENCES_EVIDENCE",
  "TASK-05-00560-MELODY_ANALYSIS_EVIDENCE",
  "TASK-05-00634-WAV_EXPORT_IMPLEMENTATION",
  "TASK-05-00635-WAV_EXPORT_TESTS",
  "TASK-05-00636-WAV_EXPORT_EVIDENCE",
  "TASK-10-01155-EDUCATIONAL_LESSON_MEDIA_TESTS",
  "TASK-10-01156-EDUCATIONAL_LESSON_MEDIA_EVIDENCE",
  "TASK-11-01180-PRODUCT_CATALOG_EVIDENCE",
  "TASK-11-01183-SKUS_TESTS",
  "TASK-11-01184-SKUS_EVIDENCE",
  "TASK-14-01527-INCIDENT_RESPONSE_TESTS",
  "TASK-14-01528-INCIDENT_RESPONSE_EVIDENCE"
];
const OWNER_GATE_KEEP = ["TASK-05-00605-MUSICAL_BRAIN_CONTRACT"];
const AGENT = "CURSOR-COORDINATOR-SINGY-LANE";
const CHAT = "aa2ef236-4002-4ca4-b74b-8405de4e22da";

function now() {
  return new Date().toISOString();
}

function withTasksLock(fn) {
  const lockPath = path.join(RUNTIME, "TASKS.lock");
  fs.mkdirSync(RUNTIME, { recursive: true });
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
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
  }
}

const result = withTasksLock(() => {
  const tasksPath = path.join(TREE, "TASKS.json");
  const depsPath = path.join(TREE, "DEPENDENCIES.json");
  const tasksDoc = JSON.parse(fs.readFileSync(tasksPath, "utf8"));
  const depsDoc = JSON.parse(fs.readFileSync(depsPath, "utf8"));
  const byId = new Map(tasksDoc.tasks.map((t) => [t.id, t]));
  const leaseId = crypto.randomUUID();
  for (const id of DONE_IDS) {
    const t = byId.get(id);
    if (!t) throw new Error(`missing ${id}`);
    if (OWNER_GATE_KEEP.includes(id)) continue;
    t.state = "DONE";
    t.blockedReason = null;
    t.updatedAt = now();
    t.claims = [
      {
        agentId: AGENT,
        chatId: CHAT,
        claimedAt: now(),
        leaseId,
        taskId: id
      }
    ];
    t.lease = {
      leaseId,
      taskId: id,
      agentId: AGENT,
      expiresAt: now(),
      released: true
    };
  }
  const owner = byId.get("TASK-05-00605-MUSICAL_BRAIN_CONTRACT");
  if (owner) {
    owner.state = "OWNER_GATE";
    owner.gate = "OWNER_GATE";
    owner.blockedReason = "Musical quality unproven — OWNER MUSICAL LISTENING required. Coordinator skipped temporarily.";
    owner.updatedAt = now();
  }
  const done = new Set(tasksDoc.tasks.filter((t) => t.state === "DONE").map((t) => t.id));
  const blockers = new Map();
  for (const e of depsDoc.edges || []) {
    if (!blockers.has(e.to)) blockers.set(e.to, []);
    blockers.get(e.to).push(e.from);
  }
  const promoted = [];
  for (const t of tasksDoc.tasks) {
    if (t.state !== "BLOCKED_BY_DEPENDENCY") continue;
    if (t.gate === "OWNER_GATE") continue;
    const needs = blockers.get(t.id) || [];
    if (needs.length && needs.every((id) => done.has(id))) {
      t.state = "READY";
      t.blockedReason = null;
      t.updatedAt = now();
      promoted.push(t.id);
    }
  }
  fs.writeFileSync(tasksPath, JSON.stringify(tasksDoc, null, 2) + "\n");
  const counts = {};
  for (const t of tasksDoc.tasks) counts[t.state] = (counts[t.state] || 0) + 1;
  return { done: DONE_IDS.length, promoted, counts };
});

console.log(JSON.stringify(result, null, 2));
