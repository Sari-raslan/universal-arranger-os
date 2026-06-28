import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readTextIfPresent(file) {
  const fullPath = path.join(root, file);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : null;
}

const failures = [];

try {
  const identity = readJson("uaos-ai-factory/platform/PLATFORM_IDENTITY.json");
  const migration = readTextIfPresent("uaos-ai-factory/platform/PLATFORM_MIGRATION_STATUS.md");
  const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
  const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
  const indexHtml = readTextIfPresent("uaos-live-clean/index.html");
  const ai001 = queue.tasks.find((task) => task.id === "AI-001");

  if (identity.platformName !== "AE Platform") failures.push("Platform name is not AE Platform.");
  if (identity.platformGitHubOwner !== "aeplatform-app") failures.push("Platform GitHub owner is not aeplatform-app.");
  if (identity.targetRepository !== "aeplatform-app/universal-arranger-os") failures.push("Target repository is incorrect.");
  if (identity.currentTransferStatus === "complete" || state.githubTransferStatus === "complete") failures.push("GitHub transfer is falsely marked complete.");
  if (identity.pushAllowed !== false || state.pushAllowed !== false) failures.push("pushAllowed must remain false.");
  if (identity.deployAllowed !== false || state.deployAllowed !== false) failures.push("deployAllowed must remain false.");
  if (state.paymentAllowed !== false) failures.push("paymentAllowed must remain false.");
  if (state.realWriterAllowed !== false) failures.push("realWriterAllowed must remain false.");
  if (identity.productionReleaseAllowed !== false || state.productionReleaseAllowed !== false) failures.push("productionReleaseAllowed must remain false.");
  if (indexHtml && !indexHtml.includes("AE Platform")) failures.push("Browser title does not contain AE Platform.");
  if (!ai001) failures.push("AI-001 is missing from task queue.");
  if (ai001 && !["DONE_LOCAL_PENDING_EXTERNAL_TRANSFER", "PENDING_EXTERNAL_TRANSFER"].includes(ai001.status)) failures.push("AI-001 status is not local-complete/pending external transfer.");
  if (migration && !migration.toLowerCase().includes("pending/postponed")) failures.push("Migration status does not mention pending/postponed transfer.");

  if (failures.length > 0) {
    console.error("UAOS AI Factory Platform Identity Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Platform Identity Check: PASS");
  console.log(`${identity.targetRepository}; transfer=${identity.currentTransferStatus}; AI-001=${ai001.status}`);
} catch (error) {
  console.error("UAOS AI Factory Platform Identity Check: FAIL");
  console.error(error.message);
  process.exit(1);
}

