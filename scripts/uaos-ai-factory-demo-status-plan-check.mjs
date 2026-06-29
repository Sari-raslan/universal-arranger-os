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
  const target = readJson("uaos-ai-factory/platform/demo-status/DEMO_STATUS_TARGET.json");
  const schema = readJson("uaos-ai-factory/platform/demo-status/DEMO_STATUS_DATA_SCHEMA.json");
  const content = readText("uaos-ai-factory/platform/demo-status/DEMO_STATUS_CONTENT_POLICY.md");
  const noProduction = readText("uaos-ai-factory/platform/demo-status/DEMO_STATUS_NO_PRODUCTION_CLAIM_POLICY.md");
  const allowed = readText("uaos-ai-factory/platform/demo-status/DEMO_STATUS_ALLOWED_FEATURES.md");
  const blocked = readText("uaos-ai-factory/platform/demo-status/DEMO_STATUS_BLOCKED_FEATURES.md");
  const routePlan = readText("uaos-ai-factory/platform/demo-status/DEMO_STATUS_FUTURE_PAGE_ROUTE_PLAN.md");
  const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
  const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
  const ai008 = queue.tasks.find((task) => task.id === "AI-008");

  if (identity.platformName !== "AE Platform" || target.platform !== "AE Platform") failures.push("Platform is not AE Platform.");
  if (target.pagePlanStatus !== "local plan only") failures.push("Demo status plan is not local-planning-only.");
  if (state.deployAllowed !== false || target.deployPerformed !== false) failures.push("Deploy must remain disabled.");
  if (state.pushAllowed !== false || target.pushPerformed !== false) failures.push("Push must remain disabled.");
  if (state.paymentAllowed !== false || target.paymentAllowed !== false) failures.push("paymentAllowed must remain false.");
  if (state.realWriterAllowed !== false || target.realWriterAllowed !== false) failures.push("realWriterAllowed must remain false.");
  if (state.productionReleaseAllowed !== false || target.productionReleaseAllowed !== false) failures.push("productionReleaseAllowed must remain false.");
  if (state.externalAutomationReady !== false || target.externalAutomationReady !== false) failures.push("externalAutomationReady must remain false.");
  if (target.currentProductStatus !== "prototype/demo/staging" || schema.status !== "prototype/demo/staging") failures.push("Page status is not prototype/demo/staging.");
  const combined = `${content}\n${noProduction}\n${allowed}\n${blocked}`.toLowerCase();
  if (combined.includes("production-ready")) failures.push("Production-ready claim is present.");
  if (combined.includes("payment-ready")) failures.push("Payment-ready claim is present.");
  if (combined.includes("real writer/export readiness")) failures.push("Real writer/export readiness claim is present.");
  if (!blocked.toLowerCase().includes("payment") || !blocked.toLowerCase().includes("real keyboard writer")) failures.push("Blocked features list is incomplete.");
  if (!allowed.toLowerCase().includes("prototype/demo ui") || !allowed.toLowerCase().includes("no public release yet")) failures.push("Allowed features list is incomplete.");
  if (!routePlan.toLowerCase().includes("route plan only") || !routePlan.toLowerCase().includes("no route was implemented")) failures.push("Future route is not marked planned only.");
  if (queue.tasks.some((task) => String(task.notes || "").toLowerCase().includes("public launch complete"))) failures.push("A task claims public launch is complete.");
  if (!ai008 || ai008.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-008 is not marked DONE_LOCAL_PLAN_ONLY.");

  if (failures.length > 0) {
    console.error("UAOS AI Factory Demo Status Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Demo Status Plan Check: PASS");
  console.log(`${target.pagePlanStatus}; route=${target.routeCandidate}; AI-008=${ai008.status}`);
} catch (error) {
  console.error("UAOS AI Factory Demo Status Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}

