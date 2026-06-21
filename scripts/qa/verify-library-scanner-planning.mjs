import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

const requiredFiles = [
  "src/uaos-local-music-engine/scanner-planning/scanner-approval-policy.json",
  "src/uaos-local-music-engine/scanner-planning/legal-asset-policy.json",
  "src/uaos-local-music-engine/scanner-planning/mock-scanner-result.json",
  "src/uaos-local-music-engine/scanner-planning/scanner-risk-checklist.json",
  "public/uaos-local-music-engine/library-scanner-approval.html",
  "public/uaos-local-music-engine/legal-asset-policy.html",
  "public/uaos-local-music-engine/mock-library-scan.html",
  "public/uaos-local-music-engine/scanner-risk-checklist.html",
  "public/uaos-local-music-engine/index.html"
];

const blockedExtensions = [".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"];

const forbiddenActivePatterns = [
  /realDiskScan["']?\s*[:=]\s*true/i,
  /recursiveScan["']?\s*[:=]\s*true/i,
  /hiddenFolderScan["']?\s*[:=]\s*true/i,
  /archiveRead["']?\s*[:=]\s*true/i,
  /sampleCopy["']?\s*[:=]\s*true/i,
  /productionParser["']?\s*[:=]\s*true/i,
  /keyboardFormatWriter["']?\s*[:=]\s*true/i,
  /keyboardFormatParser["']?\s*[:=]\s*true/i,
  /\bwriteSty\s*\(/i,
  /\bwriteSet\s*\(/i,
  /\bwritePrs\s*\(/i,
  /\bwriteStl\s*\(/i,
  /\bwritePat\s*\(/i,
  /\bwriteMsp\s*\(/i,
  /\bwriteKst\s*\(/i,
  /\bsendToKeyboard\s*\(/i,
  /\bparseProductionKeyboardFile\s*\(/i
];

function fail(msg) {
  console.error("[FAIL] " + msg);
  process.exit(1);
}

function pass(msg) {
  console.log("[PASS] " + msg);
}

for (const rel of requiredFiles) {
  const full = path.join(app, rel);
  if (!fs.existsSync(full)) fail("Missing required file: " + rel);
}
pass("Required scanner planning files exist.");

for (const rel of requiredFiles.filter(f => f.endsWith(".json"))) {
  JSON.parse(fs.readFileSync(path.join(app, rel), "utf8"));
}
pass("Scanner planning JSON files parse.");

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const scanRoots = [
  path.join(app, "src/uaos-local-music-engine/scanner-planning"),
  path.join(app, "public/uaos-local-music-engine")
];

const files = scanRoots.flatMap(walk);

for (const file of files) {
  if (blockedExtensions.includes(path.extname(file).toLowerCase())) {
    fail("Forbidden keyboard format file found: " + file);
  }
}

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of forbiddenActivePatterns) {
    if (pattern.test(text)) {
      fail("Forbidden active scanner/writer/parser pattern in " + file + ": " + pattern);
    }
  }
}

pass("No active real scanner, parser, writer, or keyboard output detected.");
console.log("UAOS LIBRARY SCANNER PLANNING QA PASS");
