import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const autopilot = path.join(root, "uaos-ai-factory", "autopilot");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(autopilot, name), "utf8"));
}

try {
  const queue = readJson("TASK_QUEUE.json");
  readJson("SAFETY_MATRIX.json");
  const task = queue.tasks.find((item) => item.status === "READY" && item.risk !== "HIGH" && item.blocked === false);

  if (!task) {
    throw new Error("No safe READY task found.");
  }

  const markdown = `# Next Task

ID: ${task.id}
Title: ${task.title}
Owner agent: ${task.ownerAgent}
Risk: ${task.risk}
Requires build: ${task.requiresBuild ? "YES" : "NO"}
Requires external account: ${task.requiresExternalAccount ? "YES" : "NO"}

## Expected Output

${task.expectedOutput}

## Notes

${task.notes}

This selector only writes the next-task note. It does not execute the task, call AI tools, push, or deploy.
`;

  fs.writeFileSync(path.join(autopilot, "NEXT_TASK.md"), markdown);
  console.log("UAOS AI Factory Next Task: PASS");
  console.log(`${task.id} ${task.title}`);
} catch (error) {
  console.error("UAOS AI Factory Next Task: FAIL");
  console.error(error.message);
  process.exit(1);
}

