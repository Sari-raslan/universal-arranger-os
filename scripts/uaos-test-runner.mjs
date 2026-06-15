import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const testsDir = path.resolve("tests");

if (!fs.existsSync(testsDir)) {
  console.error("Tests directory not found:", testsDir);
  process.exit(1);
}

const files = fs
  .readdirSync(testsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.test\.(mjs|js|cjs)$/i.test(entry.name))
  .map((entry) => path.join("tests", entry.name))
  .sort();

if (files.length === 0) {
  console.error("No test files matching *.test.mjs, *.test.js, or *.test.cjs were found.");
  process.exit(1);
}

console.log(`Running ${files.length} UAOS test files`);
for (const file of files) {
  console.log(` - ${file}`);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  shell: false,
});

process.exit(Number.isInteger(result.status) ? result.status : 1);