import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const checks = [
  ["package.json", fs.existsSync(path.join(root, "package.json"))],
  ["package-lock.json", fs.existsSync(path.join(root, "package-lock.json"))],
  ["uaos-live-clean", fs.existsSync(path.join(root, "uaos-live-clean"))],
  ["electron", fs.existsSync(path.join(root, "electron"))],
  ["scripts", fs.existsSync(path.join(root, "scripts"))],
  ["reports", fs.existsSync(path.join(root, "reports"))],
];

const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8")
);

const requiredScripts = ["check", "build"];
const missingScripts = requiredScripts.filter(
  (name) => !packageJson.scripts?.[name]
);

const failures = checks.filter(([, ok]) => !ok);

console.log("UAOS 11.3.0 DEVELOPMENT DOCTOR");
console.log("================================");

for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
}

console.log(`VERSION ${packageJson.version ?? "unknown"}`);

if (missingScripts.length > 0) {
  console.log(`FAIL missing npm scripts: ${missingScripts.join(", ")}`);
}

if (failures.length > 0 || missingScripts.length > 0) {
  process.exit(1);
}

console.log("STATUS READY_FOR_V11_3_DEVELOPMENT");