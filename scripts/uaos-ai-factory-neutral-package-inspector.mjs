import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(
  root,
  "uaos-ai-factory",
  "writer-sandbox",
  "neutral-package-writer",
  "NEUTRAL_PACKAGE_CATALOG.json"
);
const forbiddenExtensions = new Set([".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"]);
const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function relative(filePath) {
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function walkForbidden(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkForbidden(fullPath, found);
      continue;
    }
    if (entry.isFile() && forbiddenExtensions.has(path.extname(entry.name).toLowerCase())) {
      found.push(relative(fullPath));
    }
  }
  return found;
}

if (!existsSync(catalogPath)) {
  fail("Neutral package catalog is missing.");
}

const catalog = failures.length === 0 ? readJson(catalogPath) : null;
const selectedId = catalog?.current_selected_package;
const selected = catalog?.packages?.find((entry) => entry.package_id === selectedId);

if (!selected) {
  fail("Selected neutral package is missing from catalog.");
}

const packagePath = selected?.package_file_path ? path.join(root, selected.package_file_path) : null;
const packageJson = packagePath && existsSync(packagePath) ? readJson(packagePath) : null;

if (!packageJson) {
  fail("Selected package JSON is missing.");
}

if (selectedId !== "owner-neutral-003") {
  fail("Selected package must be owner-neutral-003.");
}

if (packageJson?.keyboard_native !== false) {
  fail("Selected package keyboard_native must be false.");
}

if (packageJson?.real_keyboard_compatibility !== "UNVERIFIED") {
  fail("Selected package compatibility must be UNVERIFIED.");
}

const selectedFolder = selected?.folder_path ? path.join(root, selected.folder_path) : null;
const forbidden = selectedFolder ? walkForbidden(selectedFolder) : [];
if (forbidden.length > 0) {
  fail(`Forbidden keyboard-native files found: ${forbidden.join(", ")}`);
}

console.log("UAOS Neutral Package Inspector");
console.log("LOCAL ONLY - READ ONLY - NO PACKAGE WRITES");
console.log(`Selected package: ${selectedId ?? "MISSING"}`);
console.log(`Package path: ${selected?.package_file_path ?? "MISSING"}`);
console.log(`Status: ${packageJson?.status ?? "MISSING"}`);
console.log(`Keyboard native: ${packageJson?.keyboard_native}`);
console.log(`Compatibility: ${packageJson?.real_keyboard_compatibility ?? "MISSING"}`);
console.log(`Forbidden keyboard-native files found: ${forbidden.length}`);
console.log("Real keyboard output created: NO");
console.log("Keyboard transfer allowed: NO");

if (failures.length > 0) {
  console.error("UAOS Neutral Package Inspector: FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("UAOS Neutral Package Inspector: PASS");
