import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

function fail(message) {
  console.error("[FAIL] " + message);
  process.exit(1);
}

function mustExist(relativePath) {
  const full = path.join(app, relativePath);
  if (!fs.existsSync(full)) fail("Missing: " + relativePath);
  return full;
}

const policyPath = mustExist("src/uaos-local-music-engine/final-product-gate-v1/full-local-product-gate-policy.json");
const registryPath = mustExist("src/uaos-local-music-engine/agent-command-center/desktop-agent-registry.metadata-only.json");
const taskPackPath = mustExist("src/uaos-local-music-engine/agent-command-center/uaos-agent-task-pack.json");

mustExist("public/uaos-local-music-engine/full-local-product-gate-v1.html");
mustExist("public/uaos-local-music-engine/agent-command-center.html");
mustExist("public/uaos-local-music-engine/index.html");

const policy = JSON.parse(fs.readFileSync(policyPath, "utf8"));
if (policy.format !== "UAOS_FULL_LOCAL_MUSIC_ENGINE_PRODUCT_GATE_POLICY") fail("Policy format mismatch.");
if (policy.safety.noDeploy !== true) fail("Policy noDeploy must be true.");
if (policy.safety.noDelete !== true) fail("Policy noDelete must be true.");
if (policy.safety.noAppJsTouch !== true) fail("Policy noAppJsTouch must be true.");
if (policy.safety.noKeyboardWriter !== true) fail("Policy noKeyboardWriter must be true.");
if (policy.safety.noKeyboardOutput !== true) fail("Policy noKeyboardOutput must be true.");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
if (registry.policy.executeAgents !== false) fail("Registry executeAgents must be false.");
if (registry.policy.deleteAgents !== false) fail("Registry deleteAgents must be false.");

const taskPack = JSON.parse(fs.readFileSync(taskPackPath, "utf8"));
if (taskPack.executionPolicy.autoExecuteUnknownAgents !== false) fail("Task pack autoExecuteUnknownAgents must be false.");
if (taskPack.executionPolicy.deploy !== false) fail("Task pack deploy must be false.");
if (taskPack.executionPolicy.deleteFiles !== false) fail("Task pack deleteFiles must be false.");

const appJsStatus = spawnSync("git", ["status", "--porcelain", "--", "uaos-live-clean/src/App.jsx"], {
  cwd: root,
  encoding: "utf8"
});

if ((appJsStatus.stdout || "").trim() !== "") {
  fail("App.jsx has local changes.");
}

console.log("UAOS FULL LOCAL PRODUCT GATE V1 QA PASS");
