import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readText(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

const failures = [];

try {
  const identity = readJson("uaos-ai-factory/platform/PLATFORM_IDENTITY.json");
  const target = readJson("uaos-ai-factory/platform/vercel/VERCEL_PREVIEW_TARGET.json");
  const settings = readText("uaos-ai-factory/platform/vercel/VERCEL_PROJECT_SETTINGS_PLAN.md");
  const domainPlan = readText("uaos-ai-factory/platform/vercel/VERCEL_DOMAIN_PLAN.md");
  const noProduction = readText("uaos-ai-factory/platform/vercel/VERCEL_NO_PRODUCTION_DEPLOY_POLICY.md");
  const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
  const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
  const ai002 = queue.tasks.find((task) => task.id === "AI-002");

  if (identity.platformName !== "AE Platform" || target.platform !== "AE Platform") failures.push("Platform is not AE Platform.");
  if (target.vercelAccount !== "aeplatform-app") failures.push("Vercel target account/team is not aeplatform-app.");
  if (target.gitRepositoryTarget !== "aeplatform-app/universal-arranger-os") failures.push("Git repository target is incorrect.");
  if (identity.targetRepository !== "aeplatform-app/universal-arranger-os") failures.push("Platform GitHub target is incorrect.");
  if (target.rootDirectory !== "uaos-live-clean") failures.push("Root directory is not uaos-live-clean.");
  if (target.framework !== "Vite") failures.push("Framework is not Vite.");
  if (target.buildCommand !== "npm run build") failures.push("Build command is not npm run build.");
  if (target.outputDirectory !== "dist") failures.push("Output directory is not dist.");
  if (!domainPlan.includes("aeplatform.online") || !domainPlan.toLowerCase().includes("planned/pending")) failures.push("aeplatform.online is not marked planned/pending.");
  if (!domainPlan.includes("aeplatform.app") || !domainPlan.toLowerCase().includes("email")) failures.push("aeplatform.app is not protected as email/brand domain.");
  if (target.productionDeployAllowed !== false || !noProduction.toLowerCase().includes("forbidden")) failures.push("Production deployment is not explicitly blocked.");
  if (target.dnsChangePerformed !== false || !domainPlan.toLowerCase().includes("manual/future")) failures.push("DNS changes are not marked manual/future only.");
  if (state.pushAllowed !== false) failures.push("pushAllowed must remain false.");
  if (state.deployAllowed !== false) failures.push("deployAllowed must remain false.");
  if (state.productionReleaseAllowed !== false) failures.push("productionReleaseAllowed must remain false.");
  if (state.externalAutomationReady !== false) failures.push("externalAutomationReady must remain false.");
  if (!settings.includes("uaos-live-clean")) failures.push("Project settings plan does not include root directory.");
  if (!ai002 || ai002.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-002 is not marked DONE_LOCAL_PLAN_ONLY.");

  if (failures.length > 0) {
    console.error("UAOS AI Factory Vercel Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Vercel Plan Check: PASS");
  console.log(`${target.vercelAccount}; ${target.rootDirectory}; ${target.framework}; AI-002=${ai002.status}`);
} catch (error) {
  console.error("UAOS AI Factory Vercel Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}

