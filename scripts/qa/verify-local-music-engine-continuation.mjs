import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const app = path.join(root, "uaos-live-clean");

const required = [
  "public/uaos-local-music-engine/index.html",
  "public/uaos-local-music-engine/project-studio.html",
  "public/uaos-local-music-engine/piano-roll-workspace.html",
  "public/uaos-local-music-engine/arrangement-to-daw-demo.html",
  "src/uaos-local-music-engine/demo-pack/demo-library-pack.json",
  "src/uaos-local-music-engine/presets/arabic-drums.placeholder.instrument.json",
  "src/uaos-local-music-engine/piano-roll/pianoRollModel.js",
  "src/uaos-local-music-engine/bridges/arrangementToDawBridge.js"
];

function fail(msg) {
  console.error("[FAIL] " + msg);
  process.exit(1);
}

function pass(msg) {
  console.log("[PASS] " + msg);
}

for (const rel of required) {
  const full = path.join(app, rel);
  if (!fs.existsSync(full)) fail("Missing required continuation file: " + rel);
}
pass("Continuation required files exist.");

const jsonFiles = [
  "src/uaos-local-music-engine/demo-pack/demo-library-pack.json",
  "src/uaos-local-music-engine/presets/arabic-drums.placeholder.instrument.json"
];

for (const rel of jsonFiles) {
  JSON.parse(fs.readFileSync(path.join(app, rel), "utf8"));
}
pass("Continuation JSON files parse correctly.");

const blockedExt = [".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"];
const scanRoots = [
  path.join(app, "src/uaos-local-music-engine"),
  path.join(app, "public/uaos-local-music-engine")
];

function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const all = scanRoots.flatMap(walk);

for (const file of all) {
  if (blockedExt.includes(path.extname(file).toLowerCase())) {
    fail("Forbidden keyboard format found: " + file);
  }
}
pass("No forbidden keyboard format files found.");

const dangerousPatterns = [
  "deploy",
  "vercel --prod",
  ".STY",
  ".SET",
  ".PRS",
  ".STL",
  ".PAT",
  ".MSP",
  ".KST"
];

for (const file of all) {
  const text = fs.readFileSync(file, "utf8");
  for (const p of dangerousPatterns) {
    if (text.includes(p) && !file.endsWith(".md")) {
      if (p === "deploy" && text.includes("noDeploy")) continue;
      fail("Dangerous pattern '" + p + "' found in " + file);
    }
  }
}
pass("No dangerous deploy or keyboard format patterns found in runtime files.");

console.log("UAOS LOCAL MUSIC ENGINE CONTINUATION QA PASS");
