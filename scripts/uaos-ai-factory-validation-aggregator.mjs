import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const expectedRemote = "https://github.com/Sari-raslan/universal-arranger-os.git";

function runCheck(label, command, args) {
  try {
    const output = execFileSync(command, args, { cwd: root, encoding: "utf8" });
    return { label, status: "PASS", output: output.trim().split(/\r?\n/).slice(-6) };
  } catch (error) {
    return {
      label,
      status: "FAIL",
      output: (error.stdout || error.stderr || error.message || "").trim().split(/\r?\n/).slice(-6)
    };
  }
}

function readJson(relPath) {
  return JSON.parse(readFileSync(path.join(root, relPath), "utf8"));
}

const remoteOutput = execFileSync("git", ["remote", "-v"], { cwd: root, encoding: "utf8" });
const catalogPath = "uaos-ai-factory/writer-sandbox/neutral-package-writer/NEUTRAL_PACKAGE_CATALOG.json";
const catalog = existsSync(path.join(root, catalogPath)) ? readJson(catalogPath) : null;
const selectedPackage = catalog?.current_selected_package ?? "MISSING";

const checks = [
  runCheck("neutral metadata check", process.execPath, ["scripts/uaos-ai-factory-neutral-metadata-check.mjs"]),
  runCheck("writer sandbox check", process.execPath, ["scripts/uaos-ai-factory-writer-sandbox-check.mjs"]),
  runCheck("writer manifest validator", process.execPath, ["scripts/uaos-ai-factory-writer-manifest-validator.mjs"])
];

const aggregate = {
  schema: "uaos-validation-aggregate-status-v1",
  status: checks.every((check) => check.status === "PASS") && remoteOutput.includes(expectedRemote) ? "PASS" : "FAIL",
  gitRemote: {
    expected: expectedRemote,
    unchanged: remoteOutput.includes(expectedRemote)
  },
  selectedNeutralPackage: selectedPackage,
  checks,
  safety: {
    realKeyboardOutput: "NO",
    keyboardTransfer: "NO",
    pushDeployVercel: "NO",
    legacyStyStatus: "documented/untouched",
    externalAutomation: "NO"
  }
};

writeFileSync(
  path.join(root, "uaos-ai-factory", "VALIDATION_AGGREGATE_STATUS.json"),
  `${JSON.stringify(aggregate, null, 2)}\n`,
  "utf8"
);

const md = `# Validation Aggregate Status

LOCAL ONLY - AGGREGATED STATUS ONLY - NO KEYBOARD OUTPUT

## Status

${aggregate.status}

## Git Remote

- Expected: \`${expectedRemote}\`
- Unchanged: ${aggregate.gitRemote.unchanged ? "YES" : "NO"}

## Selected Neutral Package

\`${selectedPackage}\`

## Checks

| Check | Status |
| --- | --- |
${checks.map((check) => `| ${check.label} | ${check.status} |`).join("\n")}

## Safety

- Real keyboard output: NO
- Keyboard transfer: NO
- Push/deploy/Vercel: NO
- Legacy .STY status: documented/untouched
- External automation: NO
`;

writeFileSync(path.join(root, "uaos-ai-factory", "VALIDATION_AGGREGATE_STATUS.md"), md, "utf8");

console.log("UAOS Validation Aggregator");
console.log(`Status: ${aggregate.status}`);
console.log(`Selected neutral package: ${selectedPackage}`);
console.log(`Remote unchanged: ${aggregate.gitRemote.unchanged ? "YES" : "NO"}`);
console.log("Real keyboard output: NO");
console.log("Keyboard transfer: NO");

if (aggregate.status !== "PASS") {
  process.exit(1);
}
