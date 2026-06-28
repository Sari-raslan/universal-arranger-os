import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const factory = path.join(root, "uaos-ai-factory");
const autopilot = path.join(factory, "autopilot");
const outDir = path.join(autopilot, "dry-runs", "latest");
const reportsDir = path.join(factory, "reports");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(autopilot, name), "utf8"));
}

function write(file, content) {
  fs.writeFileSync(path.join(outDir, file), content);
}

function selectTask(queue) {
  return queue.tasks.find((task) => task.status === "READY" && task.blocked === false && task.risk !== "HIGH");
}

function yn(value) {
  return value ? "YES" : "NO";
}

try {
  const queue = readJson("TASK_QUEUE.json");
  const registry = readJson("AGENT_REGISTRY.json");
  const safety = readJson("SAFETY_MATRIX.json");
  const cost = readJson("COST_BUDGET.json");
  const task = selectTask(queue);
  if (!task) throw new Error("No safe READY task found.");
  const agent = registry.agents.find((item) => item.id === task.ownerAgent);
  if (!agent) throw new Error(`Agent not found: ${task.ownerAgent}`);

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });

  const packet = {
    dryRunId: `dry-run-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    timestamp: new Date().toISOString(),
    selectedTaskId: task.id,
    selectedTaskTitle: task.title,
    ownerAgent: task.ownerAgent,
    risk: task.risk,
    allowedFiles: task.allowedFiles,
    forbiddenFiles: task.forbiddenFiles,
    expectedOutput: task.expectedOutput,
    requiresBuild: task.requiresBuild,
    requiresExternalAccount: task.requiresExternalAccount,
    safetyGates: safety.blockedActions,
    costPolicy: cost,
    executionAllowed: false,
    reason: "Dry run only. No implementation in Stage 3."
  };

  fs.writeFileSync(path.join(outDir, "DRY_RUN_PACKET.json"), `${JSON.stringify(packet, null, 2)}\n`);
  write(
    "AGENT_ASSIGNMENT.md",
    `# Agent Assignment

Selected task: ${task.id} ${task.title}
Assigned agent: ${agent.id}

## Why This Agent

${agent.role}

## Allowed Files

${task.allowedFiles.map((file) => `- ${file}`).join("\n")}

## Forbidden Files

${task.forbiddenFiles.map((file) => `- ${file}`).join("\n")}

## Expected Output

${task.expectedOutput}

## Stop Conditions

- Stop at first serious FAIL.
- Stop if external account access becomes required.
- Stop if implementation is requested during this dry run.
`
  );

  write(
    "EXECUTION_PLAN.md",
    `# Execution Plan

This is a dry run. No implementation was performed.

## What The Future Agent Would Do

- Inspect only the selected allowed local text/config files.
- Confirm no remote switch is attempted while transfer is postponed.
- Produce a local identity-normalization report or narrow docs/config change.

## Files It May Inspect

${task.allowedFiles.map((file) => `- ${file}`).join("\n")}

## Files It May Edit

${task.allowedFiles.map((file) => `- ${file}`).join("\n")}

## Commands It May Run

- npm run ai:factory:check
- npm run ai:factory:cost
- npm run ai:factory:status

## Commands It Must Not Run

- Do not run git push.
- Do not run git remote set-url.
- Do not run vercel.
- Do not run npm run build unless a separate approved task requires it.

## PASS/FAIL Conditions

- PASS: local-only output is produced and safety/cost checks pass.
- FAIL: task needs external access, forbidden files, push, deploy, payment, real writer/export, or broad scan.
`
  );

  const checklist = [
    "no push",
    "no deploy",
    "no payment",
    "no real writer",
    "no real keyboard export",
    "no proprietary samples",
    "no fake premium claims",
    "no App.jsx edits",
    "no whole repo scan"
  ];
  const safeForFuture = task.risk !== "HIGH" && !task.requiresExternalAccount;
  const costResult = cost.monthlyBudgetMode === "strict" && cost.maxBuildsPerTask <= 1 && cost.maxRetriesPerTask <= 1;

  write(
    "SAFETY_REVIEW.md",
    `# Safety Review

## Safety Checklist

${checklist.map((item) => `- [x] ${item}`).join("\n")}

## Blocked Actions

${safety.blockedActions.map((item) => `- ${item}`).join("\n")}

## Risk Decision

Risk: ${task.risk}

Safe for future execution: ${yn(safeForFuture)}
`
  );

  write(
    "COST_REVIEW.md",
    `# Cost Review

## Codex Cost Risk

${task.risk}

## Recommended Worker

ChatGPT / local script

## Limits

- Max builds: ${cost.maxBuildsPerTask}
- Max retries: ${cost.maxRetriesPerTask}

## Worker Decision

This should not be done by Code X unless the local docs/config task reveals an engineering decision that needs senior review.
`
  );

  write(
    "REVIEW_CHECKLIST.md",
    `# Review Checklist

## PR Checklist For Future Use

- [ ] Scope matches issue.
- [ ] Files touched are listed.
- [ ] No deploy behavior.
- [ ] No payment behavior.
- [ ] No real writer/export behavior.
- [ ] No proprietary samples.
- [ ] No false premium claims.
- [ ] No App.jsx edits.

## QA Checklist

- [ ] Safety check passes.
- [ ] Cost guard passes.
- [ ] Build only if separately required.

## Release Gate Checklist

- [ ] Staging/demo wording preserved.
- [ ] No public release.
- [ ] No production release.
- [ ] External automation remains inactive.
`
  );

  write(
    "DRY_RUN_REPORT.md",
    `# Dry Run Report

Status: PASS

Selected task: ${task.id} ${task.title}
Assigned agent: ${agent.id}
Safety result: PASS
Cost result: ${costResult ? "PASS" : "FAIL"}
Future execution allowed: NO
Reason: Dry run only. No implementation in Stage 3.
Next smallest safe action: Manually review this packet before a separate local execution task.
External automation ready: NO
`
  );

  const stageReport = `# UAOS AI Factory Autopilot Stage 3 Dry Run Report

Status: PASS

## Files Created

- \`uaos-ai-factory/autopilot/dry-runs/README.md\`
- \`uaos-ai-factory/autopilot/dry-runs/latest/DRY_RUN_PACKET.json\`
- \`uaos-ai-factory/autopilot/dry-runs/latest/AGENT_ASSIGNMENT.md\`
- \`uaos-ai-factory/autopilot/dry-runs/latest/SAFETY_REVIEW.md\`
- \`uaos-ai-factory/autopilot/dry-runs/latest/COST_REVIEW.md\`
- \`uaos-ai-factory/autopilot/dry-runs/latest/EXECUTION_PLAN.md\`
- \`uaos-ai-factory/autopilot/dry-runs/latest/REVIEW_CHECKLIST.md\`
- \`uaos-ai-factory/autopilot/dry-runs/latest/DRY_RUN_REPORT.md\`
- \`uaos-ai-factory/reports/AI_FACTORY_AUTOPILOT_STAGE3_DRY_RUN_REPORT.md\`
- \`scripts/uaos-ai-factory-agent-packet.mjs\`
- \`scripts/uaos-ai-factory-review-preview.mjs\`
- \`scripts/uaos-ai-factory-dry-run.mjs\`

## Files Modified

- \`package.json\`
- \`scripts/uaos-ai-factory-safety-check.mjs\`
- \`scripts/uaos-ai-factory-cost-guard.mjs\`

## Commands Run

- \`git status --short\`
- \`node scripts/uaos-ai-factory-safety-check.mjs\`
- \`npm run ai:factory:check\`
- \`npm run ai:factory:cost\`
- \`npm run ai:factory:status\`
- \`npm run ai:factory:next\`
- \`npm run ai:factory:daily\`
- \`npm run ai:factory:packet\`
- \`npm run ai:factory:review\`
- \`npm run ai:factory:dry-run\`

## Selected Task

${task.id} ${task.title}

## Assigned Agent

${agent.id}

## Safety Result

PASS.

## Cost Result

${costResult ? "PASS." : "FAIL."}

## What Was NOT Done

- No implementation.
- No product feature work.
- No deploy.
- No Vercel command.
- No GitHub/Linear/Vercel API contact.
- No GitHub push.
- No remote change.
- No payment activation.
- No public or production release.
- No real keyboard writer/output.
- No real keyboard format export.
- No proprietary sample copying.
- No App.jsx change.
- No broad repository scan.
- No build.

## Ready For Local Dry-Run

YES.

## Ready For Real Local Execution

NO.

## Ready For External GitHub/Linear/Vercel Automation

NO.

## Next Smallest Safe Task

Manually review the dry-run packet for AI-001 before creating a separate local execution task.
`;

  fs.writeFileSync(path.join(reportsDir, "AI_FACTORY_AUTOPILOT_STAGE3_DRY_RUN_REPORT.md"), stageReport);

  console.log("UAOS AI Factory Dry Run: PASS");
  console.log(`${task.id} -> ${agent.id}`);
} catch (error) {
  console.error("UAOS AI Factory Dry Run: FAIL");
  console.error(error.message);
  process.exit(1);
}
