import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const expectedOrigin = "https://github.com/Sari-raslan/universal-arranger-os.git";

function filePath(file) {
  return path.join(root, file);
}

function exists(file) {
  return fs.existsSync(filePath(file));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(filePath(file), "utf8"));
}

function readText(file) {
  return fs.readFileSync(filePath(file), "utf8");
}

function requireFile(file) {
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
}

try {
  const requiredFiles = [
    "uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/EXECUTION_PACKET.json",
    "uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/COST_GUARD_AUTOMATION_PLAN.md",
    "uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/COST_BUDGET_POLICY.md",
    "uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/COST_RISK_CLASSIFICATION.md",
    "uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/CODEX_USAGE_POLICY.md",
    "uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/CHEAP_WORKER_ROUTING_POLICY.md",
    "uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/STOP_RULES_AND_LIMITS.md",
    "uaos-ai-factory/platform/cost-guard/COST_GUARD_TARGET.json",
    "uaos-ai-factory/platform/cost-guard/COST_BUDGET_LIMITS.json",
    "uaos-ai-factory/platform/cost-guard/COST_RISK_MATRIX.json",
    "uaos-ai-factory/platform/cost-guard/COST_TOOL_ROUTING.json",
    "uaos-ai-factory/platform/cost-guard/COST_STOP_RULES.json",
    "uaos-ai-factory/platform/cost-guard/COST_NO_AUTONOMOUS_SPEND_POLICY.md",
    "uaos-ai-factory/platform/cost-guard/COST_CODEX_SENIOR_ENGINEER_ONLY_POLICY.md",
    "uaos-ai-factory/reports/AI_FACTORY_STAGE12_AI009_COST_GUARD_PLAN_REPORT.md"
  ];

  requiredFiles.forEach(requireFile);

  if (failures.length === 0) {
    const identity = readJson("uaos-ai-factory/platform/PLATFORM_IDENTITY.json");
    const packet = readJson("uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/EXECUTION_PACKET.json");
    const target = readJson("uaos-ai-factory/platform/cost-guard/COST_GUARD_TARGET.json");
    const limits = readJson("uaos-ai-factory/platform/cost-guard/COST_BUDGET_LIMITS.json");
    const risk = readJson("uaos-ai-factory/platform/cost-guard/COST_RISK_MATRIX.json");
    const routing = readJson("uaos-ai-factory/platform/cost-guard/COST_TOOL_ROUTING.json");
    const stops = readJson("uaos-ai-factory/platform/cost-guard/COST_STOP_RULES.json");
    const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
    const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
    const packageJson = readJson("package.json");
    const ai009 = queue.tasks.find((task) => task.id === "AI-009");
    const ai010 = queue.tasks.find((task) => task.id === "AI-010");
    const ai011 = queue.tasks.find((task) => task.id === "AI-011");
    const noSpend = readText("uaos-ai-factory/platform/cost-guard/COST_NO_AUTONOMOUS_SPEND_POLICY.md").toLowerCase();
    const codexPolicy = readText("uaos-ai-factory/platform/cost-guard/COST_CODEX_SENIOR_ENGINEER_ONLY_POLICY.md").toLowerCase();
    const planText = readText("uaos-ai-factory/executions/AI-009-cost-guard-automation-plan/COST_GUARD_AUTOMATION_PLAN.md").toLowerCase();
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";

    if (identity.platformName !== "AE Platform" || target.platform !== "AE Platform") failures.push("Platform is not AE Platform.");
    if (packet.status !== "DONE_LOCAL_PLAN_ONLY" || target.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-009 is not DONE_LOCAL_PLAN_ONLY.");
    if (target.planStatus !== "local plan only" || target.integrationStatus !== "local plan only") failures.push("Cost guard is not local-planning-only.");
    if (packet.externalAutomationReady !== false || target.externalAutomationReady !== false || state.externalAutomationReady !== false) failures.push("External automation must remain disabled.");
    if (target.autonomousSpendingAllowed !== false || packet.autonomousSpendingAllowed !== false) failures.push("Autonomous spending must remain false.");
    if (target.billingApiUsed !== false || target.openAiApiUsed !== false || packet.billingApiUsed !== false || packet.openAiApiUsed !== false) failures.push("External billing/OpenAI API usage must remain false.");
    if (!noSpend.includes("autonomous credit buying") || !noSpend.includes("prohibited")) failures.push("No autonomous spend policy is incomplete.");
    if (!codexPolicy.includes("senior engineer") || limits.codeXAlwaysOnAllowed !== false) failures.push("Code X/Codex is not senior-engineer-only.");
    if (routing.localFirst !== true || routing.oneSmallTaskAtATime !== true) failures.push("Local-first one-small-task routing is missing.");
    if (!routing.routes.some((route) => route.risk === "LOW" && String(route.worker).includes("local script"))) failures.push("LOW risk local script/manual routing is missing.");
    if (!routing.routes.some((route) => route.risk === "HIGH" && route.approvalRequired === true && route.allowed === false)) failures.push("HIGH risk approval gate is missing.");
    if (!risk.BLOCKED || !String(risk.BLOCKED.defaultRoute).includes("do not perform")) failures.push("BLOCKED risk route is missing.");
    if (stops.wholeRepoScansAllowed !== false || !planText.includes("block whole repo scans")) failures.push("Whole repo scans are not blocked.");
    if (stops.loopsAllowed !== false || !planText.includes("block loops")) failures.push("Loops are not blocked.");
    if (limits.maxBuildsPerTask !== 1 || limits.maxRetriesPerTask !== 1) failures.push("Build/retry limits must be one each.");
    if (target.pushAllowed !== false || target.deployAllowed !== false || target.paymentAllowed !== false || target.productionReleaseAllowed !== false || target.realWriterAllowed !== false) failures.push("Push/deploy/payment/production/writer gates must remain false.");
    if (state.pushAllowed !== false || state.deployAllowed !== false || state.paymentAllowed !== false || state.productionReleaseAllowed !== false || state.realWriterAllowed !== false) failures.push("Autopilot safety gates must remain false.");
    if (!ai009 || ai009.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("TASK_QUEUE does not mark AI-009 DONE_LOCAL_PLAN_ONLY.");
    if (!ai010 || !["READY", "DONE_LOCAL_PLAN_ONLY"].includes(ai010.status)) failures.push("AI-010 is not in an expected post-cost-guard state.");
    const laterReadyTask = queue.tasks.find((task) => task.status === "READY" && task.blocked === false);
    if (ai010.status === "DONE_LOCAL_PLAN_ONLY" && (!ai011 || !["READY", "DONE_LOCAL_PLAN_ONLY"].includes(ai011.status))) failures.push("AI-011 is not in an expected post-transfer-readiness state.");
    if (ai011?.status === "DONE_LOCAL_PLAN_ONLY" && (!laterReadyTask || !/^AI-0(12|13|14|16|17|18)$/.test(laterReadyTask.id))) failures.push("A safe later READY task is not available after AI-011 completion.");
    if (packageJson.scripts["ai:factory:cost-guard-plan"] !== "node scripts/uaos-ai-factory-cost-guard-plan.mjs") failures.push("Package script ai:factory:cost-guard-plan is missing or changed.");
    if (packageJson.scripts["ai:factory:cost-guard-plan"].match(/vercel|deploy|payment|writer|export/i)) failures.push("Cost guard plan script includes a forbidden action keyword.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Git remote origin URL is not the expected current origin.");
    if (planText.includes("app.jsx modification required")) failures.push("Plan requires App.jsx modification.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Cost Guard Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Cost Guard Plan Check: PASS");
  console.log("AI-009=DONE_LOCAL_PLAN_ONLY; externalAutomationReady=false; remote unchanged");
} catch (error) {
  console.error("UAOS AI Factory Cost Guard Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
