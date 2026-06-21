import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

const required = [
  "src/uaos-local-music-engine/real-limited-scanner-approval/real-limited-scanner-v1-approval-policy.json",
  "src/uaos-local-music-engine/real-limited-scanner-approval/real-limited-scanner-v1-scope-contract.json",
  "src/uaos-local-music-engine/real-limited-scanner-approval/real-limited-scanner-v1-risk-checklist.json",
  "src/uaos-local-music-engine/real-limited-scanner-approval/real-limited-scanner-v1-implementation-spec.json",
  "public/uaos-local-music-engine/real-limited-scanner-approval.html",
  "public/uaos-local-music-engine/real-scanner-risk-checklist.html"
];

function fail(msg) {
  console.error("[FAIL] " + msg);
  process.exit(1);
}

for (const rel of required) {
  const full = path.join(app, rel);
  if (!fs.existsSync(full)) fail("Missing approval pack file: " + rel);
}

for (const rel of required.filter(r => r.endsWith(".json"))) {
  JSON.parse(fs.readFileSync(path.join(app, rel), "utf8"));
}

const files = required.map(rel => path.join(app, rel));
const forbidden = [
  /\bfs\.readdirSync\s*\(/i,
  /\bfs\.statSync\s*\(/i,
  /\bfs\.readFileSync\s*\(/i,
  /\bfs\.writeFileSync\s*\(/i,
  /\bfs\.copyFileSync\s*\(/i,
  /\bfs\.renameSync\s*\(/i,
  /\bfs\.rmSync\s*\(/i,
  /\bfs\.unlinkSync\s*\(/i,
  /\bcreateReadStream\s*\(/i,
  /\bcreateWriteStream\s*\(/i,
  /\bdecodeAudioData\s*\(/i,
  /\bAudioBuffer\b/i,
  /\bAdmZip\b/i,
  /\bunzip\b/i,
  /\b7z\b/i,
  /\brar\b/i,
  /\bwriteSty\s*\(/i,
  /\bwriteSet\s*\(/i,
  /\bwritePrs\s*\(/i,
  /\bsendToKeyboard\s*\(/i,
  /\bparseProductionKeyboardFile\s*\(/i,
  /implementationStatus["']?\s*[:=]\s*["']implemented["']/i,
  /approvedByUser["']?\s*[:=]\s*true/i
];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) {
      fail("Forbidden implementation/approval pattern found in " + file + ": " + pattern);
    }
  }
}

const policy = JSON.parse(fs.readFileSync(path.join(app, "src/uaos-local-music-engine/real-limited-scanner-approval/real-limited-scanner-v1-approval-policy.json"), "utf8"));
if (policy.format !== "UAOS_REAL_LIMITED_SCANNER_V1_APPROVAL_POLICY") fail("Policy format mismatch.");
if (policy.implementationStatus !== "not-implemented") fail("Policy must remain not-implemented.");
if (policy.approvedByUser !== false) fail("Policy approvedByUser must remain false in approval pack.");

console.log("UAOS REAL LIMITED SCANNER APPROVAL PACK QA PASS");
