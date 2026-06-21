import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

const requiredFiles = [
  "src/uaos-local-music-engine/library/library.schema.json",
  "src/uaos-local-music-engine/library/local-library-index.json",
  "src/uaos-local-music-engine/metadata/articulation-map.json",
  "src/uaos-local-music-engine/presets/oud.placeholder.instrument.json",
  "src/uaos-local-music-engine/presets/arabic-violin.placeholder.instrument.json",
  "src/uaos-local-music-engine/sampler/samplerEngine.js",
  "src/uaos-local-music-engine/daw/dawProjectEngine.js",
  "src/uaos-local-music-engine/arrangement/arrangementEngine.js",
  "public/uaos-local-music-engine/library-dashboard.html",
  "public/uaos-local-music-engine/sampler-dashboard.html",
  "public/uaos-local-music-engine/daw-workspace.html",
  "public/uaos-local-music-engine/arrangement-workspace.html",
  "public/uaos-local-music-engine/qa-dashboard.html"
];

const blockedExtensions = [".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"];

const blockedImplementationPatterns = [
  "writeSty",
  "writeSet",
  "writePrs",
  "writeStl",
  "writePat",
  "writeMsp",
  "writeKst",
  "keyboardWriter",
  "realKeyboardOutput",
  "productionParser"
];

function fail(message) {
  console.error(`[FAIL] ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`[PASS] ${message}`);
}

for (const rel of requiredFiles) {
  const full = path.join(app, rel);
  if (!fs.existsSync(full)) {
    fail(`Missing required file: ${rel}`);
  }
}
pass("Required files exist.");

for (const rel of [
  "src/uaos-local-music-engine/library/library.schema.json",
  "src/uaos-local-music-engine/library/local-library-index.json",
  "src/uaos-local-music-engine/metadata/articulation-map.json",
  "src/uaos-local-music-engine/presets/oud.placeholder.instrument.json",
  "src/uaos-local-music-engine/presets/arabic-violin.placeholder.instrument.json"
]) {
  const full = path.join(app, rel);
  JSON.parse(fs.readFileSync(full, "utf8"));
}
pass("JSON files parse correctly.");

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const newLayerFiles = [
  ...walk(path.join(app, "src/uaos-local-music-engine")),
  ...walk(path.join(app, "public/uaos-local-music-engine"))
];

for (const file of newLayerFiles) {
  const ext = path.extname(file).toLowerCase();
  if (blockedExtensions.includes(ext)) {
    fail(`Forbidden keyboard format found: ${file}`);
  }
}
pass("No forbidden keyboard format files in new layer.");

for (const file of newLayerFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of blockedImplementationPatterns) {
    if (text.includes(pattern) && !text.includes(`${pattern}: false`) && !text.includes(`no${pattern[0].toUpperCase()}${pattern.slice(1)}: true`)) {
      fail(`Possible forbidden implementation pattern "${pattern}" in ${file}`);
    }
  }
}
pass("No forbidden writer/output/parser implementation patterns detected.");

console.log("UAOS LOCAL MUSIC ENGINE QA PASS");
