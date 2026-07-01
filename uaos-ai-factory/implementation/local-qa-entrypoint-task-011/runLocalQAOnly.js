import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SAFETY_BANNER = "LOCAL QA ONLY - NO DEPLOY - NO EXPORT - NO KEYBOARD OUTPUT";
const taskDir = path.dirname(fileURLToPath(import.meta.url));
const localCiDir = path.resolve(taskDir, "..", "local-ci-qa-runner-task-010");
const localCiScript = path.join(localCiDir, "run-uaos-local-ci.js");
const localCiResults = path.join(localCiDir, "UAOS_LOCAL_CI_TASK_010_RESULTS.json");
const resultsPath = path.join(taskDir, "UAOS_LOCAL_QA_ENTRYPOINT_TASK_011_RESULTS.json");
const reportPath = path.join(taskDir, "UAOS_LOCAL_QA_ENTRYPOINT_TASK_011_REPORT.md");

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeOutputs(result) {
  fs.writeFileSync(resultsPath, `${JSON.stringify(result, null, 2)}\n`);

  fs.writeFileSync(reportPath, `# UAOS Local QA Entry Point Task 011 Report

Status: ${result.status}

Generated: ${result.generatedAt}

## Launcher

- Safety banner printed: YES
- Task 010 runner executed: ${result.localCiExecuted ? "YES" : "NO"}
- Task 010 status: ${result.localCiStatus || "UNKNOWN"}
- Exit code: ${result.exitCode}

## Safety Confirmation

- App.jsx touched: NO
- Deploy attempted: NO
- Vercel used: NO
- Token used: NO
- Product export created: NO
- Keyboard output created: NO
- Proprietary copying: NO
- Jobcenter final folders touched: NO
- Final businessplan packs touched: NO
`);
}

console.log(SAFETY_BANNER);

if (!fs.existsSync(localCiScript)) {
  const missingResult = {
    task: "011",
    entryPoint: "runLocalQAOnly",
    generatedAt: new Date().toISOString(),
    status: "FAIL",
    localCiExecuted: false,
    localCiScript,
    error: "Task 010 local CI runner was not found.",
    exitCode: 1,
    safety: {
      deployAttempted: false,
      vercelUsed: false,
      tokenUsed: false,
      productExportCreated: false,
      keyboardOutputCreated: false
    }
  };

  writeOutputs(missingResult);
  console.error(missingResult.error);
  process.exit(1);
}

const run = spawnSync(process.execPath, [localCiScript], {
  cwd: localCiDir,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});

if (run.stdout) {
  process.stdout.write(run.stdout);
}

if (run.stderr) {
  process.stderr.write(run.stderr);
}

const localCi = readJsonIfExists(localCiResults);
const localCiStatus = localCi?.overallStatus || null;
const passed = run.status === 0 && localCiStatus === "PASS";

const result = {
  task: "011",
  entryPoint: "runLocalQAOnly",
  generatedAt: new Date().toISOString(),
  status: passed ? "PASS" : "FAIL",
  banner: SAFETY_BANNER,
  localCiExecuted: true,
  localCiScript,
  localCiExitCode: run.status,
  localCiStatus,
  localCiResults,
  resultsPath,
  reportPath,
  exitCode: passed ? 0 : 1,
  safety: {
    deployAttempted: false,
    vercelUsed: false,
    tokenUsed: false,
    productExportCreated: false,
    keyboardOutputCreated: false,
    proprietaryCopying: false,
    jobcenterFinalFoldersTouched: false,
    finalBusinessplanPacksTouched: false
  }
};

writeOutputs(result);

console.log(JSON.stringify({
  task: "011",
  entryPoint: "runLocalQAOnly",
  status: result.status,
  localCiStatus,
  resultsPath,
  reportPath
}, null, 2));

process.exit(result.exitCode);
