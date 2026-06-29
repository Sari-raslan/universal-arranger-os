import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const writerDir = path.join(root, "uaos-ai-factory", "writer-sandbox", "neutral-package-writer");
const outputDir = path.join(writerDir, "outputs", "owner-neutral-001");

const forbiddenExtensions = new Set([".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"]);
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
  "deploy",
  "vercel",
  "payment",
  "payments"
]);

const requiredScaffoldFiles = [
  path.join(writerDir, "README.md"),
  path.join(writerDir, "NEUTRAL_WRITER_OUTPUT_POLICY.md"),
  path.join(writerDir, "neutral-package.template.json")
];

function relative(filePath) {
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function fail(message) {
  console.error(`UAOS Neutral Package Writer: FAIL - ${message}`);
  process.exit(1);
}

function walk(dir, found = { forbiddenFiles: [], forbiddenFolders: [] }) {
  if (!existsSync(dir)) {
    return found;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const lowerName = entry.name.toLowerCase();

    if (entry.isDirectory()) {
      if (forbiddenFolderNames.has(lowerName)) {
        found.forbiddenFolders.push(relative(fullPath));
      }
      walk(fullPath, found);
      continue;
    }

    if (entry.isFile() && forbiddenExtensions.has(path.extname(lowerName))) {
      found.forbiddenFiles.push(relative(fullPath));
    }
  }

  return found;
}

if (!existsSync(writerDir) || !statSync(writerDir).isDirectory()) {
  fail("neutral package writer scaffold folder is missing");
}

for (const requiredFile of requiredScaffoldFiles) {
  if (!existsSync(requiredFile) || !statSync(requiredFile).isFile()) {
    fail(`required scaffold file missing: ${relative(requiredFile)}`);
  }
}

const found = walk(writerDir);

if (found.forbiddenFiles.length > 0) {
  fail(`forbidden keyboard-native files found: ${found.forbiddenFiles.join(", ")}`);
}

if (found.forbiddenFolders.length > 0) {
  fail(`forbidden sample/audio/deploy/payment folders found: ${found.forbiddenFolders.join(", ")}`);
}

if (existsSync(outputDir)) {
  const requiredOutputFiles = [
    path.join(outputDir, "OWNER_NEUTRAL_001.uaos-neutral.json"),
    path.join(outputDir, "MANIFEST.json"),
    path.join(outputDir, "CHECKSUMS.sha256"),
    path.join(outputDir, "VALIDATION.json"),
    path.join(outputDir, "README_OWNER_NEUTRAL_001.md")
  ];

  for (const requiredFile of requiredOutputFiles) {
    if (!existsSync(requiredFile) || !statSync(requiredFile).isFile()) {
      fail(`neutral package output is incomplete: ${relative(requiredFile)}`);
    }
  }
}

const remoteOutput = execFileSync("git", ["remote", "-v"], {
  cwd: root,
  encoding: "utf8"
});

if (!remoteOutput.includes("https://github.com/Sari-raslan/universal-arranger-os.git")) {
  fail("origin remote does not match required Sari-raslan repository");
}

console.log("UAOS Neutral Package Writer: PASS");
console.log("Mode: scaffold/check");
console.log("Allowed future output extension: .uaos-neutral.json");
console.log("Real keyboard output created: NO");
console.log("Forbidden keyboard-native files found: 0");
console.log("Proprietary sample/audio folders found: 0");
console.log("Remote unchanged: https://github.com/Sari-raslan/universal-arranger-os.git");
