import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sandboxDir = path.join(root, "uaos-ai-factory", "writer-sandbox");

const requiredPaths = [
  path.join(sandboxDir, "README.md"),
  path.join(sandboxDir, "SANDBOX_OUTPUT_POLICY.md"),
  path.join(sandboxDir, "sandbox-manifest.template.json"),
  path.join(sandboxDir, "dry-run-package.schema.json")
];

const forbiddenExtensions = new Set([
  ".sty",
  ".set",
  ".prs",
  ".stl",
  ".pat",
  ".msp",
  ".kst"
]);

const forbiddenFolderNames = new Set([
  "audio",
  "audios",
  "sample",
  "samples",
  "library",
  "libraries",
  "kontakt",
  "native-instruments",
  "native_instruments",
  "ni"
]);

function fail(message) {
  console.error(`UAOS Writer Sandbox Check: FAIL - ${message}`);
  process.exit(1);
}

function walk(dir, found = { forbiddenFiles: [], forbiddenFolders: [] }) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const lowerName = entry.name.toLowerCase();

    if (entry.isDirectory()) {
      if (forbiddenFolderNames.has(lowerName)) {
        found.forbiddenFolders.push(path.relative(root, fullPath));
      }
      walk(fullPath, found);
      continue;
    }

    if (entry.isFile() && forbiddenExtensions.has(path.extname(lowerName))) {
      found.forbiddenFiles.push(path.relative(root, fullPath));
    }
  }

  return found;
}

if (!existsSync(sandboxDir) || !statSync(sandboxDir).isDirectory()) {
  fail("writer sandbox folder is missing");
}

for (const requiredPath of requiredPaths) {
  if (!existsSync(requiredPath) || !statSync(requiredPath).isFile()) {
    fail(`required file missing: ${path.relative(root, requiredPath)}`);
  }
}

const found = walk(sandboxDir);

if (found.forbiddenFiles.length > 0) {
  fail(`forbidden real keyboard output files found: ${found.forbiddenFiles.join(", ")}`);
}

if (found.forbiddenFolders.length > 0) {
  fail(`forbidden proprietary sample/audio folders found: ${found.forbiddenFolders.join(", ")}`);
}

const remoteOutput = execFileSync("git", ["remote", "-v"], {
  cwd: root,
  encoding: "utf8"
});

if (!remoteOutput.includes("https://github.com/Sari-raslan/universal-arranger-os.git")) {
  fail("origin remote does not match required Sari-raslan repository");
}

console.log("UAOS Writer Sandbox Check: PASS");
console.log("Sandbox scaffold present: uaos-ai-factory/writer-sandbox");
console.log("Forbidden real keyboard output files found: 0");
console.log("Forbidden sample/audio/proprietary folders found: 0");
console.log("Remote unchanged: https://github.com/Sari-raslan/universal-arranger-os.git");
