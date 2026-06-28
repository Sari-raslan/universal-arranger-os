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
  const target = readJson("uaos-ai-factory/platform/github/GITHUB_TARGET.json");
  const settings = readText("uaos-ai-factory/platform/github/GITHUB_REPOSITORY_SETTINGS_PLAN.md");
  const protection = readText("uaos-ai-factory/platform/github/GITHUB_BRANCH_PROTECTION_RULES_PLAN.md");
  const checks = readText("uaos-ai-factory/platform/github/GITHUB_REQUIRED_STATUS_CHECKS.md");
  const agentPolicy = readText("uaos-ai-factory/platform/github/GITHUB_AI_AGENT_PERMISSIONS_POLICY.md");
  const noDirectPush = readText("uaos-ai-factory/platform/github/GITHUB_NO_DIRECT_PUSH_POLICY.md");
  const noProduction = readText("uaos-ai-factory/platform/github/GITHUB_NO_PRODUCTION_RELEASE_POLICY.md");
  const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
  const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
  const ai004 = queue.tasks.find((task) => task.id === "AI-004");

  if (identity.platformName !== "AE Platform" || target.platform !== "AE Platform") failures.push("Platform is not AE Platform.");
  if (target.targetOwner !== "aeplatform-app") failures.push("GitHub target owner is incorrect.");
  if (target.targetRepository !== "aeplatform-app/universal-arranger-os") failures.push("Target repository is incorrect.");
  if (identity.targetRepository !== "aeplatform-app/universal-arranger-os") failures.push("Platform repository target is incorrect.");
  if (!["postponed", "pending"].includes(target.currentTransferStatus) || identity.currentTransferStatus === "complete") failures.push("GitHub transfer is falsely complete or not pending/postponed.");
  if (state.externalAutomationReady !== false || target.externalAutomationReady !== false) failures.push("externalAutomationReady must remain false.");
  if (state.pushAllowed !== false || target.pushAllowed !== false) failures.push("pushAllowed must remain false.");
  if (state.deployAllowed !== false || target.deployAllowed !== false) failures.push("deployAllowed must remain false.");
  if (state.productionReleaseAllowed !== false || target.productionReleaseAllowed !== false) failures.push("productionReleaseAllowed must remain false.");
  if (state.paymentAllowed !== false) failures.push("paymentAllowed must remain false.");
  if (state.realWriterAllowed !== false) failures.push("realWriterAllowed must remain false.");
  if (!noDirectPush.toLowerCase().includes("strictly prohibited")) failures.push("No direct push policy is missing or weak.");
  if (!noProduction.toLowerCase().includes("strictly prohibited")) failures.push("No production release policy is missing or weak.");
  if (target.branchProtectionStatus !== "local plan only" || !protection.toLowerCase().includes("not active")) failures.push("Branch protection is not marked planned-only/inactive.");
  if (!agentPolicy.toLowerCase().includes("branch + pr workflow")) failures.push("AI agents are not required to use branch + PR workflow.");
  if (!protection.toLowerCase().includes("require pull request") || !protection.toLowerCase().includes("require status checks") || !protection.toLowerCase().includes("block forced updates")) failures.push("master/main protection lacks PR, checks, or forced-update block.");
  if (target.githubApiUsed !== false || target.ghCommandUsed !== false) failures.push("GitHub API or gh usage is marked enabled.");
  if (settings.toLowerCase().includes("automation is active") || checks.toLowerCase().includes("automation is active")) failures.push("A plan claims GitHub automation is active.");
  if (!ai004 || ai004.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-004 is not marked DONE_LOCAL_PLAN_ONLY.");

  if (failures.length > 0) {
    console.error("UAOS AI Factory GitHub Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory GitHub Plan Check: PASS");
  console.log(`${target.targetRepository}; transfer=${target.currentTransferStatus}; AI-004=${ai004.status}`);
} catch (error) {
  console.error("UAOS AI Factory GitHub Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
