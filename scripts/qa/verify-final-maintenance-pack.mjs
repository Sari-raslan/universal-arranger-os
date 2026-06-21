import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

const required = [
  "scripts/qa/uaos-local-health-check.mjs",
  "scripts/qa/verify-uaos-final-static-audit.mjs",
  "public/uaos-local-music-engine/final-status-snapshot.html",
  "public/uaos-local-music-engine/safe-cleanup-plan.html",
  "public/uaos-local-music-engine/master-commands.html",
  "public/uaos-local-music-engine/index.html",
  "src/uaos-local-music-engine/final-maintenance-pack/uaos-final-status-snapshot.json",
  "src/uaos-local-music-engine/final-maintenance-pack/uaos-safe-cleanup-plan-no-delete.json"
];

function fail(msg){
  console.error("[FAIL] " + msg);
  process.exit(1);
}

for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) fail("Missing: " + rel);
}

const cleanup = JSON.parse(fs.readFileSync(path.join(app, "src/uaos-local-music-engine/final-maintenance-pack/uaos-safe-cleanup-plan-no-delete.json"), "utf8"));
if (cleanup.policy.deleteNow !== false) fail("cleanup deleteNow must be false");
if (cleanup.policy.moveNow !== false) fail("cleanup moveNow must be false");
if (cleanup.policy.archiveNow !== false) fail("cleanup archiveNow must be false");

console.log("UAOS FINAL MAINTENANCE PACK QA PASS");
