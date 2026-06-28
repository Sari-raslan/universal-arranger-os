import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const autopilot = path.join(root, "uaos-ai-factory", "autopilot");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(autopilot, name), "utf8"));
}

try {
  const state = readJson("AUTOPILOT_STATE.json");
  const registry = readJson("AGENT_REGISTRY.json");
  const queue = readJson("TASK_QUEUE.json");
  const budget = readJson("COST_BUDGET.json");
  const safety = readJson("SAFETY_MATRIX.json");
  const enabledAgents = registry.agents.map((agent) => agent.id).join(", ");
  const nextTask = queue.tasks.find((task) => task.status === "READY" && task.risk !== "HIGH" && task.blocked === false);

  console.log("UAOS AI Factory Status: PASS");
  console.log(`Phase: ${state.phase}`);
  console.log(`Agents: ${enabledAgents}`);
  console.log(`Blocked: ${safety.blockedActions.join(", ")}`);
  console.log(`Next: ${nextTask ? `${nextTask.id} ${nextTask.title}` : "none"}`);
  console.log(`Safety: ${safety.status}; budget=${budget.monthlyBudgetMode}`);
} catch (error) {
  console.error("UAOS AI Factory Status: FAIL");
  console.error(error.message);
  process.exit(1);
}

