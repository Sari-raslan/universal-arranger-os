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
  const target = readJson("uaos-ai-factory/platform/qa/QA_TARGET.json");
  const buildPolicy = readText("uaos-ai-factory/platform/qa/QA_BUILD_TEST_POLICY.md");
  const commands = readText("uaos-ai-factory/platform/qa/QA_REQUIRED_COMMANDS_PLAN.md");
  const safety = readText("uaos-ai-factory/platform/qa/QA_SAFETY_CHECK_POLICY.md");
  const escalation = readText("uaos-ai-factory/platform/qa/QA_FAILURE_ESCALATION_POLICY.md");
  const manual = readText("uaos-ai-factory/platform/qa/QA_BROWSER_HARDWARE_MANUAL_VALIDATION.md");
  const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
  const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
  const ai006 = queue.tasks.find((task) => task.id === "AI-006");

  if (identity.platformName !== "AE Platform" || target.platform !== "AE Platform") failures.push("Platform is not AE Platform.");
  if (target.qaStatus !== "local plan only" || target.integrationStatus !== "local plan only") failures.push("QA plan is not local-planning-only.");
  if (target.deployAllowed !== false || state.deployAllowed !== false) failures.push("Deploy must remain disabled.");
  if (target.pushAllowed !== false || state.pushAllowed !== false) failures.push("Push must remain disabled.");
  if (target.productionReleaseAllowed !== false || state.productionReleaseAllowed !== false) failures.push("productionReleaseAllowed must remain false.");
  if (target.paymentAllowed !== false || state.paymentAllowed !== false) failures.push("paymentAllowed must remain false.");
  if (target.realWriterAllowed !== false || state.realWriterAllowed !== false) failures.push("realWriterAllowed must remain false.");
  if (target.externalAutomationReady !== false || state.externalAutomationReady !== false) failures.push("externalAutomationReady must remain false.");
  if (!buildPolicy.toLowerCase().includes("safety check") || !safety.toLowerCase().includes("safety check")) failures.push("QA plan does not include safety check.");
  if (!buildPolicy.toLowerCase().includes("cost guard") || !commands.toLowerCase().includes("ai:factory:cost")) failures.push("QA plan does not include cost guard.");
  if (!commands.includes("npm run build --prefix uaos-live-clean") || !commands.toLowerCase().includes("future controlled check")) failures.push("Build command is not marked future/controlled.");
  if (buildPolicy.toLowerCase().includes("production-ready") || buildPolicy.toLowerCase().includes("production readiness is confirmed")) failures.push("QA plan claims production readiness.");
  if (!manual.toLowerCase().includes("browser") || !manual.toLowerCase().includes("midi") || !manual.toLowerCase().includes("hardware")) failures.push("Manual browser/MIDI/hardware validation is missing.");
  if (!buildPolicy.toLowerCase().includes("stop at first serious fail") || !escalation.toLowerCase().includes("do not loop")) failures.push("Stop-on-first-serious-fail rule is missing.");
  if (!ai006 || ai006.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-006 is not marked DONE_LOCAL_PLAN_ONLY.");

  if (failures.length > 0) {
    console.error("UAOS AI Factory QA Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory QA Plan Check: PASS");
  console.log(`${target.qaStatus}; buildRun=${target.buildRunPerformed}; AI-006=${ai006.status}`);
} catch (error) {
  console.error("UAOS AI Factory QA Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}

