import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

const required = [
  "src/uaos-local-music-engine/final-local-gate/final-local-gate-policy.json",
  "public/uaos-local-music-engine/final-local-gate.html",
  "public/uaos-local-music-engine/qa-command-center.html",
  "scripts/qa/verify-local-music-engine-all.mjs",
  "scripts/qa/final-local-music-engine-gate.mjs"
];

function fail(msg) {
  console.error("[FAIL] " + msg);
  process.exit(1);
}

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) fail("Missing required final gate asset: " + rel);
}

const policy = JSON.parse(fs.readFileSync(path.join(app, "src/uaos-local-music-engine/final-local-gate/final-local-gate-policy.json"), "utf8"));

if (policy.format !== "UAOS_FINAL_LOCAL_GATE_POLICY") fail("Policy format mismatch.");
if (policy.hardLocks.deploy !== false) fail("Policy deploy lock mismatch.");
if (policy.hardLocks.midiExport !== false) fail("Policy midiExport lock mismatch.");
if (policy.hardLocks.audioRendering !== false) fail("Policy audioRendering lock mismatch.");
if (policy.hardLocks.keyboardWriter !== false) fail("Policy keyboardWriter lock mismatch.");
if (policy.hardLocks.keyboardOutput !== false) fail("Policy keyboardOutput lock mismatch.");

console.log("UAOS FINAL LOCAL GATE ASSETS QA PASS");
