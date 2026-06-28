import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readText(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

try {
  const identity = readJson("uaos-ai-factory/platform/PLATFORM_IDENTITY.json");
  const target = readJson("uaos-ai-factory/platform/copilot/COPILOT_TARGET.json");
  const usage = readText("uaos-ai-factory/platform/copilot/COPILOT_AGENT_USAGE_POLICY.md");
  const firstTask = readText("uaos-ai-factory/platform/copilot/COPILOT_FIRST_SAFE_TASK.md");
  const branchPolicy = readText("uaos-ai-factory/platform/copilot/COPILOT_BRANCH_AND_PR_POLICY.md");
  const noAutomerge = readText("uaos-ai-factory/platform/copilot/COPILOT_NO_AUTOMERGE_POLICY.md");
  const costPolicy = readText("uaos-ai-factory/platform/copilot/COPILOT_COST_CONTROL_POLICY.md");
  const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
  const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
  const ai005 = queue.tasks.find((task) => task.id === "AI-005");

  if (identity.platformName !== "AE Platform" || target.platform !== "AE Platform") failures.push("Platform is not AE Platform.");
  if (identity.targetRepository !== "aeplatform-app/universal-arranger-os" || target.plannedRepository !== "aeplatform-app/universal-arranger-os") failures.push("GitHub target is incorrect.");
  if (!["postponed", "pending"].includes(target.currentTransferStatus) || identity.currentTransferStatus === "complete") failures.push("GitHub transfer is falsely complete or not pending/postponed.");
  if (target.integrationStatus !== "local plan only" || !usage.toLowerCase().includes("not active")) failures.push("Copilot integration is not planned-only/inactive.");
  if (target.copilotTokenStored !== false) failures.push("Copilot token must not be stored.");
  if (target.githubTokenStored !== false) failures.push("GitHub token must not be stored.");
  if (state.externalAutomationReady !== false || target.externalAutomationReady !== false) failures.push("externalAutomationReady must remain false.");
  if (state.pushAllowed !== false || target.pushAllowed !== false) failures.push("pushAllowed must remain false.");
  if (state.deployAllowed !== false || target.deployAllowed !== false) failures.push("deployAllowed must remain false.");
  if (state.productionReleaseAllowed !== false || target.productionReleaseAllowed !== false) failures.push("productionReleaseAllowed must remain false.");
  if (state.paymentAllowed !== false || target.paymentAllowed !== false) failures.push("paymentAllowed must remain false.");
  if (state.realWriterAllowed !== false || target.realWriterAllowed !== false) failures.push("realWriterAllowed must remain false.");
  if (!noAutomerge.toLowerCase().includes("strictly prohibited")) failures.push("No automerge policy is missing or weak.");
  if (!usage.toLowerCase().includes("must not deploy")) failures.push("No production deploy policy is missing.");
  if (target.firstPlannedIssueRisk !== "LOW" || !firstTask.includes("Risk: LOW")) failures.push("First Copilot task is not low risk.");
  if (!firstTask.includes("App.jsx") || !firstTask.toLowerCase().includes("forbidden")) failures.push("First Copilot task does not forbid App.jsx.");
  const forbiddenFirstTask = ["real writer", "export", "payment", "deploy"];
  for (const phrase of forbiddenFirstTask) {
    if (!firstTask.toLowerCase().includes(phrase)) failures.push(`First Copilot task does not forbid ${phrase}.`);
  }
  if (!firstTask.toLowerCase().includes("branch + pr workflow") || !branchPolicy.toLowerCase().includes("one pr per task")) failures.push("First Copilot task does not require branch + PR later.");
  if (usage.toLowerCase().includes("automation is active") || branchPolicy.toLowerCase().includes("automation is active")) failures.push("A task claims external automation is active.");
  if (!costPolicy.toLowerCase().includes("no broad scans") || !costPolicy.toLowerCase().includes("one task at a time")) failures.push("Cost policy is incomplete.");
  if (!ai005 || ai005.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-005 is not marked DONE_LOCAL_PLAN_ONLY.");

  if (failures.length > 0) {
    console.error("UAOS AI Factory Copilot Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Copilot Plan Check: PASS");
  console.log(`${target.firstPlannedIssueId}; risk=${target.firstPlannedIssueRisk}; AI-005=${ai005.status}`);
} catch (error) {
  console.error("UAOS AI Factory Copilot Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}

