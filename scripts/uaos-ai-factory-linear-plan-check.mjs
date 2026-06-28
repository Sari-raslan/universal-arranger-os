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
  const target = readJson("uaos-ai-factory/platform/linear/LINEAR_TARGET.json");
  const settings = readText("uaos-ai-factory/platform/linear/LINEAR_WORKSPACE_SETTINGS_PLAN.md");
  const labels = readText("uaos-ai-factory/platform/linear/LINEAR_LABELS_STATUSES_PLAN.md");
  const noApi = readText("uaos-ai-factory/platform/linear/LINEAR_NO_EXTERNAL_API_POLICY.md");
  const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
  const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
  const backlogCsv = readText("uaos-ai-factory/platform/linear/LINEAR_BACKLOG_IMPORT.csv");
  const automation = readText("uaos-ai-factory/platform/linear/LINEAR_AGENT_AUTOMATION_POLICY.md");
  const ai003 = queue.tasks.find((task) => task.id === "AI-003");

  if (identity.platformName !== "AE Platform" || target.platform !== "AE Platform") failures.push("Platform is not AE Platform.");
  if (target.integrationStatus !== "local plan only") failures.push("Linear workspace is not marked planned/local-only.");
  if (target.workspaceCandidate !== "AE Platform") failures.push("Workspace candidate is not AE Platform.");
  if (target.mainProject !== "UAOS - Universal Arranger OS") failures.push("Main project is incorrect.");
  if (state.externalAutomationReady !== false || target.externalAutomationReady !== false) failures.push("externalAutomationReady must remain false.");
  if (target.apiTokenStored !== false) failures.push("API token must not be stored.");
  if (target.linearApiUsed !== false || !noApi.toLowerCase().includes("no linear api")) failures.push("Linear API usage is not disabled.");
  if (state.pushAllowed !== false) failures.push("pushAllowed must remain false.");
  if (state.deployAllowed !== false) failures.push("deployAllowed must remain false.");
  if (state.productionReleaseAllowed !== false) failures.push("productionReleaseAllowed must remain false.");
  if (state.realWriterAllowed !== false) failures.push("realWriterAllowed must remain false.");
  if (state.paymentAllowed !== false) failures.push("paymentAllowed must remain false.");
  if (!backlogCsv.includes("AI-004") || !backlogCsv.includes("AI-010")) failures.push("Backlog import CSV is incomplete.");
  if (!automation.toLowerCase().includes("planned only") || !automation.toLowerCase().includes("human approval")) failures.push("Agent automation is not marked planned/manual approval required.");
  if (settings.toLowerCase().includes("api token:") || settings.toLowerCase().includes("production release ready")) failures.push("Settings plan contains unsafe token or release readiness language.");
  if (labels.toLowerCase().includes("production release ready")) failures.push("Labels plan claims production release readiness.");
  if (!ai003 || ai003.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-003 is not marked DONE_LOCAL_PLAN_ONLY.");

  if (failures.length > 0) {
    console.error("UAOS AI Factory Linear Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Linear Plan Check: PASS");
  console.log(`${target.workspaceCandidate}; ${target.mainProject}; AI-003=${ai003.status}`);
} catch (error) {
  console.error("UAOS AI Factory Linear Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}

