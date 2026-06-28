import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const autopilot = path.join(root, "uaos-ai-factory", "autopilot");
const outDir = path.join(autopilot, "dry-runs", "latest");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(autopilot, name), "utf8"));
}

function selectTask(queue) {
  return queue.tasks.find((task) => task.status === "READY" && task.blocked === false && task.risk !== "HIGH");
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
  fs.writeFileSync(
    path.join(outDir, "AGENT_ASSIGNMENT.md"),
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
- Stop if task requires external account access.
- Stop if files outside the allowed scope are needed.
- Stop before any implementation because Stage 3 is dry-run only.
`
  );

  console.log("UAOS AI Factory Agent Packet: PASS");
  console.log(`${task.id} -> ${agent.id}`);
} catch (error) {
  console.error("UAOS AI Factory Agent Packet: FAIL");
  console.error(error.message);
  process.exit(1);
}

