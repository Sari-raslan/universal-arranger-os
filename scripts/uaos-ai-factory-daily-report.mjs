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

## Ready Tasks

${ready.map((task) => `- ${task.id}: ${task.title} (${task.risk})`).join("\n") || "- None"}

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

