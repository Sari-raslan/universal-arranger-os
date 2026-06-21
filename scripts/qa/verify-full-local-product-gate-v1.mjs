import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

const required = [
  "src/uaos-local-music-engine/final-product-gate-v1/full-local-product-gate-policy.json",
  "src/uaos-local-music-engine/agent-command-center/desktop-agent-registry.metadata-only.json",
  "src/uaos-local-music-engine/agent-command-center/uaos-agent-task-pack.json",
  "public/uaos-local-music-engine/full-local-product-gate-v1.html",
  "public/uaos-local-music-engine/agent-command-center.html",
  "scripts/qa/verify-local-music-engine-all.mjs"
];

function fail(msg) {
  console.error("[FAIL] " + msg);
  process.exit(1);
}

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) fail("Missing full local product gate asset: " + rel);
}

const policy = JSON.parse(fs.readFileSync(path.join(app, "src/uaos-local-music-engine/final-product-gate-v1/full-local-product-gate-policy.json"), "utf8"));
if (policy.format !== "UAOS_FULL_LOCAL_MUSIC_ENGINE_PRODUCT_GATE_POLICY") fail("Policy format mismatch.");
if (policy.safety.noDeploy !== true) fail("noDeploy safety mismatch.");
if (policy.safety.noDelete !== true) fail("noDelete safety mismatch.");
if (policy.safety.noAppJsTouch !== true) fail("noAppJsTouch safety mismatch.");
if (policy.safety.noKeyboardWriter !== true) fail("noKeyboardWriter safety mismatch.");
if (policy.safety.noKeyboardOutput !== true) fail("noKeyboardOutput safety mismatch.");
if (policy.safety.noMidiExport !== true) fail("noMidiExport safety mismatch.");
if (policy.safety.noAudioRender !== true) fail("noAudioRender safety mismatch.");

const registry = JSON.parse(fs.readFileSync(path.join(app, "src/uaos-local-music-engine/agent-command-center/desktop-agent-registry.metadata-only.json"), "utf8"));
if (registry.policy.executeAgents !== false) fail("Agent registry must not execute agents.");
if (registry.policy.deleteAgents !== false) fail("Agent registry must not delete agents.");

const taskPack = JSON.parse(fs.readFileSync(path.join(app, "src/uaos-local-music-engine/agent-command-center/uaos-agent-task-pack.json"), "utf8"));
if (taskPack.executionPolicy.autoExecuteUnknownAgents !== false) fail("Task pack auto execution must be false.");
if (taskPack.executionPolicy.deleteFiles !== false) fail("Task pack delete must be false.");
if (taskPack.executionPolicy.deploy !== false) fail("Task pack deploy must be false.");

const appJs = spawnSync("git", ["status", "--porcelain", "--", "uaos-live-clean/src/App.jsx"], {
  cwd: root,
  encoding: "utf8"
});
if (String(appJs.stdout || "").trim() !== "") fail("App.jsx has changes.");

console.log("UAOS FULL LOCAL PRODUCT GATE V1 QA PASS");
