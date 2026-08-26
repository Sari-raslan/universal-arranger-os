#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const TREE = "C:\\keyboard-manager-clean\\uaos-program-tree";
const RUNTIME = "C:\\keyboard-manager-clean\\uaos-agent-factory\\.runtime\\program-tree";
const DONE_IDS = [
  "TASK-00-00005-PORTFOLIO_TREE_MATERIALIZATION_CONTRACT",
  "TASK-00-00006-PORTFOLIO_TREE_MATERIALIZATION_IMPLEMENT",
  "TASK-00-00007-PORTFOLIO_TREE_MATERIALIZATION_TESTS",
  "TASK-00-00008-PORTFOLIO_TREE_MATERIALIZATION_EVIDENCE",
  "TASK-01-00163-SUPPORT_BUNDLE_TESTS",
  "TASK-01-00164-SUPPORT_BUNDLE_EVIDENCE",
  "TASK-02-00252-VOICE_LIFECYCLE_EVIDENCE",
  "TASK-02-00279-JOURNAL_TESTS",
  "TASK-02-00280-JOURNAL_EVIDENCE",
  "TASK-11-01244-RELEASE_NOTES_EVIDENCE",
  "TASK-12-01370-WEBSITE_ACCESSIBILITY_IMPLEMENTATION",
  "TASK-12-01371-WEBSITE_ACCESSIBILITY_TESTS",
  "TASK-12-01372-WEBSITE_ACCESSIBILITY_EVIDENCE"
];
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
        try { fs.closeSync(fd); } catch {}
        try { fs.unlinkSync(lockPath); } catch {}
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
    t.state = "DONE";
    t.blockedReason = null;
    t.updatedAt = now();
    t.claims = [{ agentId: AGENT, chatId: CHAT, claimedAt: now(), leaseId, taskId: id }];
    t.lease = { leaseId, taskId: id, agentId: AGENT, expiresAt: now(), released: true };
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
