import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(
  root,
  "uaos-ai-factory",
  "writer-sandbox",
  "neutral-package-writer",
  "outputs",
  "owner-neutral-002"
);
const packagePath = path.join(packageDir, "OWNER_NEUTRAL_002.uaos-neutral.json");
const forbiddenExtensions = new Set([".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"]);

const failures = [];

function relative(filePath) {
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function fail(message) {
  failures.push(message);
}

function requireTrue(value, message) {
  if (value !== true) fail(message);
}

function requireFalse(value, message) {
  if (value !== false) fail(message);
}

function requirePresent(value, message) {
  if (value === undefined || value === null || value === "") fail(message);
}

function walkForbiddenFiles(dir, found = []) {
  if (!existsSync(dir)) return found;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkForbiddenFiles(fullPath, found);
      continue;
    }
    if (entry.isFile() && forbiddenExtensions.has(path.extname(entry.name).toLowerCase())) {
      found.push(relative(fullPath));
    }
  }

  return found;
}

if (!existsSync(packagePath) || !statSync(packagePath).isFile()) {
  fail("owner-neutral-002 package is missing");
} else {
  const metadataPackage = JSON.parse(readFileSync(packagePath, "utf8"));

  requirePresent(metadataPackage.package_id, "package_id is missing");
  requirePresent(metadataPackage.status, "status is missing");
  requireTrue(metadataPackage.owner_only, "owner_only must be true");
  requireFalse(metadataPackage.keyboard_native, "keyboard_native must be false");
  requireTrue(metadataPackage.not_public_release, "not_public_release must be true");
  requireTrue(metadataPackage.not_production, "not_production must be true");

  if (metadataPackage.real_keyboard_compatibility !== "UNVERIFIED") {
    fail("real_keyboard_compatibility must be UNVERIFIED");
  }

  if (!Array.isArray(metadataPackage.sections) || metadataPackage.sections.length === 0) {
    fail("sections must exist");
  }

  if (!Array.isArray(metadataPackage.tracks) || metadataPackage.tracks.length === 0) {
    fail("tracks must exist");
  }

  if (!metadataPackage.metadata || typeof metadataPackage.metadata !== "object") {
    fail("metadata object must exist");
  }

  requirePresent(metadataPackage.manifest_ref, "manifest_ref is missing");
  requirePresent(metadataPackage.checksum_ref, "checksum_ref is missing");
  requireTrue(metadataPackage.no_proprietary_samples, "no_proprietary_samples must be true");
  requireTrue(
    metadataPackage.no_kontakt_native_instruments_content,
    "no_kontakt_native_instruments_content must be true"
  );

  if (metadataPackage.metadata) {
    requireTrue(metadataPackage.metadata.no_audio_samples, "metadata.no_audio_samples must be true");
    requireTrue(
      metadataPackage.metadata.no_proprietary_libraries,
      "metadata.no_proprietary_libraries must be true"
    );
    requireTrue(
      metadataPackage.metadata.no_kontakt_native_instruments_content,
      "metadata.no_kontakt_native_instruments_content must be true"
    );
    requireTrue(
      metadataPackage.metadata.no_keyboard_native_output,
      "metadata.no_keyboard_native_output must be true"
    );
  }
}

for (const requiredFile of ["MANIFEST.json", "CHECKSUMS.sha256"]) {
  const filePath = path.join(packageDir, requiredFile);
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    fail(`${requiredFile} is missing beside owner-neutral-002`);
  }
}

const forbiddenFiles = walkForbiddenFiles(packageDir);
if (forbiddenFiles.length > 0) {
  fail(`forbidden keyboard-native files found: ${forbiddenFiles.join(", ")}`);
}

const remoteOutput = execFileSync("git", ["remote", "-v"], {
  cwd: root,
  encoding: "utf8"
});

if (!remoteOutput.includes("https://github.com/Sari-raslan/universal-arranger-os.git")) {
  fail("origin remote does not match required Sari-raslan repository");
}

if (failures.length > 0) {
  console.error("UAOS Neutral Metadata Check: FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("UAOS Neutral Metadata Check: PASS");
console.log("Package checked: uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/OWNER_NEUTRAL_002.uaos-neutral.json");
console.log("Real keyboard output created: NO");
console.log("Forbidden keyboard-native files found: 0");
console.log("Proprietary samples included: NO");
console.log("Kontakt/Native Instruments content included: NO");
console.log("Remote unchanged: https://github.com/Sari-raslan/universal-arranger-os.git");
