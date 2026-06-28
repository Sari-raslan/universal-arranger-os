import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const autopilot = path.join(root, "uaos-ai-factory", "autopilot");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(autopilot, name), "utf8"));
}

try {
  const state = readJson("AUTOPILOT_STATE.json");
  const queue = readJson("TASK_QUEUE.json");
  const budget = readJson("COST_BUDGET.json");
  const safety = readJson("SAFETY_MATRIX.json");
  const ready = queue.tasks.filter((task) => task.status === "READY" && !task.blocked);
  const completed = queue.tasks.filter((task) => task.status !== "READY" && !task.blocked);
  const blocked = queue.tasks.filter((task) => task.blocked);
  const next = ready.find((task) => task.risk !== "HIGH");

  const report = `# UAOS AI Factory Daily Report

Status: PASS

## Current State

- Project: ${state.project}
- Platform: ${state.platform}
- Phase: ${state.phase}
- Mode: ${state.mode}
- GitHub transfer: ${state.githubTransferStatus}
${state.lastExecutedTask ? `- Last executed task: ${state.lastExecutedTask}` : ""}

${state.lastExecutedTask ? `## Stage 4 Result

- AI-001 platform identity normalization: DONE_LOCAL_PENDING_EXTERNAL_TRANSFER
- Remote unchanged.
- External automation remains not ready.
` : ""}
${state.vercelPlanStatus ? `## Stage 5 Result

- AI-002 Vercel preview setup plan: ${state.vercelPlanStatus}
- No deploy.
- No DNS change.
- No Vercel API use.
- External automation remains not ready.
` : ""}
${state.linearPlanStatus ? `## Stage 6 Result

- AI-003 Linear workspace roadmap plan: ${state.linearPlanStatus}
- No Linear API use.
- No external automation enabled.
- External automation remains not ready.
` : ""}
${state.githubBranchProtectionPlanStatus ? `## Stage 7 Result

- AI-004 GitHub branch protection plan: ${state.githubBranchProtectionPlanStatus}
- No GitHub API use.
- No gh command.
- No repository settings changed.
- External automation remains not ready.
` : ""}
${state.copilotPlanStatus ? `## Stage 8 Result

- AI-005 Copilot agent first issue plan: ${state.copilotPlanStatus}
- No GitHub issue created.
- No Copilot service invoked.
- No external automation enabled.
- External automation remains not ready.
` : ""}

## Ready Tasks

${ready.map((task) => `- ${task.id}: ${task.title} (${task.risk})`).join("\n") || "- None"}

## Completed / Pending External Tasks

${completed.map((task) => `- ${task.id}: ${task.title} (${task.status})`).join("\n") || "- None"}

## Blocked Tasks

${blocked.map((task) => `- ${task.id}: ${task.title}`).join("\n") || "- None"}

## Cost Warning

- Budget mode: ${budget.monthlyBudgetMode}
- Max builds per task: ${budget.maxBuildsPerTask}
- Max retries per task: ${budget.maxRetriesPerTask}
- Stop on first serious FAIL: ${budget.stopOnFirstSeriousFail ? "YES" : "NO"}

## Safety Gates

${safety.blockedActions.map((action) => `- Blocked: ${action}`).join("\n")}

## Next Safe Task

${next ? `${next.id}: ${next.title}` : "None"}
`;

  fs.writeFileSync(path.join(autopilot, "DAILY_REPORT.md"), report);
  console.log("UAOS AI Factory Daily Report: PASS");
  console.log(`Next: ${next ? `${next.id} ${next.title}` : "none"}`);
} catch (error) {
  console.error("UAOS AI Factory Daily Report: FAIL");
  console.error(error.message);
  process.exit(1);
}
