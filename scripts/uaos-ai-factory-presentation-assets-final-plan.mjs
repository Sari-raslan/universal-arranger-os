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

function hasUnsafeClaim(text, phrase) {
  const index = text.indexOf(phrase);
  if (index === -1) return false;
  const window = text.slice(Math.max(0, index - 80), index + phrase.length + 80);
  return !/\b(no|not|none|neither|must not|do not|without|prohibited|blocked|must not imply|must not claim)\b/.test(window);
}

try {
  const requiredFiles = [
    "uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/EXECUTION_PACKET.json",
    "uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/PRESENTATION_ASSET_FINAL_CHECKLIST.md",
    "uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/SEND_READINESS_MATRIX.md",
    "uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/CLAIMS_FINAL_REVIEW_CHECKLIST.md",
    "uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/OWNER_SEND_SEQUENCE.md",
    "uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/RESULT.md",
    "uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/NEXT_ACTIONS.md",
    "uaos-ai-factory/platform/presentation-assets/PRESENTATION_ASSET_TARGET.json",
    "uaos-ai-factory/platform/presentation-assets/PRESENTATION_ASSET_SAFETY_POLICY.md",
    "uaos-ai-factory/reports/AI_FACTORY_STAGE19_AI016_PRESENTATION_ASSET_FINAL_CHECKLIST_REPORT.md"
  ];

  requiredFiles.forEach(requireFile);

  if (failures.length === 0) {
    const packet = readJson("uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/EXECUTION_PACKET.json");
    const target = readJson("uaos-ai-factory/platform/presentation-assets/PRESENTATION_ASSET_TARGET.json");
    const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
    const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
    const packageJson = readJson("package.json");
    const ai016 = queue.tasks.find((task) => task.id === "AI-016");
    const checklist = readText("uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/PRESENTATION_ASSET_FINAL_CHECKLIST.md");
    const matrix = readText("uaos-ai-factory/executions/AI-016-presentation-asset-final-checklist/SEND_READINESS_MATRIX.md");
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";
    const combinedPlanText = requiredFiles
      .filter((file) => file.endsWith(".md") || file.endsWith(".json"))
      .map((file) => readText(file))
      .join("\n")
      .toLowerCase();

    if (packet.status !== "DONE_LOCAL_PLAN_ONLY" || target.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-016 presentation asset checklist is not DONE_LOCAL_PLAN_ONLY.");
    if (!ai016 || ai016.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("TASK_QUEUE does not mark AI-016 DONE_LOCAL_PLAN_ONLY.");
    const phaseNumber = Number(String(state.phase || "").match(/LOCAL_EXECUTION_STAGE_(\d+)/)?.[1] || 0);
    if (phaseNumber < 19 || state.presentationAssetFinalChecklistStatus !== "DONE_LOCAL_PLAN_ONLY") failures.push("AUTOPILOT_STATE does not mark Stage 19 complete.");
    if (!checklist.includes("LOCAL ONLY") || !checklist.includes("STATIC LOCAL DEMO")) failures.push("Checklist does not include required local/static labels.");
    if (!matrix.includes("LOCAL ONLY") || !matrix.includes("STATIC LOCAL DEMO")) failures.push("Send-readiness matrix does not include required local/static labels.");
    if (target.releaseType !== "LOCAL ONLY - NOT PUBLIC RELEASE" || packet.releaseType !== "LOCAL ONLY - NOT PUBLIC RELEASE") failures.push("Release type marker is incorrect.");
    if (target.currentOrigin !== expectedOrigin || packet.currentOriginMustRemain !== expectedOrigin) failures.push("Current origin value is not the expected Sari-raslan repository.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Local git config origin URL is not unchanged.");
    if (target.publicUrlsCreated !== false || packet.publicUrlsCreated !== false) failures.push("Public URLs must not be created.");
    if (target.deployPerformed !== false || packet.deployPerformed !== false || state.deployAllowed !== false) failures.push("Deploy must remain blocked.");
    if (target.vercelCommandRun !== false || packet.vercelCommandRun !== false) failures.push("Vercel command must remain false.");
    if (target.pushAllowed !== false || packet.pushPerformed !== false || state.pushAllowed !== false) failures.push("Commit publication must remain blocked.");
    if (target.paymentAllowed !== false || packet.paymentActionPerformed !== false || state.paymentAllowed !== false) failures.push("Payment must remain blocked.");
    if (target.realWriterAllowed !== false || packet.realWriterExportCreated !== false || state.realWriterAllowed !== false) failures.push("Writer/export must remain blocked.");
    if (target.externalAutomationReady !== false || packet.externalAutomationReady !== false || state.externalAutomationReady !== false) failures.push("External automation must remain disabled.");
    if (hasUnsafeClaim(combinedPlanText, "public release")) failures.push("Unsafe public release claim found.");
    if (hasUnsafeClaim(combinedPlanText, "live payment")) failures.push("Unsafe live payment claim found.");
    if (hasUnsafeClaim(combinedPlanText, "live customer")) failures.push("Unsafe live customer claim found.");
    if (hasUnsafeClaim(combinedPlanText, "payment readiness")) failures.push("Unsafe payment readiness claim found.");
    if (hasUnsafeClaim(combinedPlanText, "real keyboard writer")) failures.push("Unsafe real keyboard writer claim found.");
    if (hasUnsafeClaim(combinedPlanText, "real keyboard export")) failures.push("Unsafe real keyboard export claim found.");
    if (hasUnsafeClaim(combinedPlanText, "proprietary sample")) failures.push("Unsafe proprietary sample claim found.");
    if (hasUnsafeClaim(combinedPlanText, "proprietary library")) failures.push("Unsafe proprietary library claim found.");
    if (combinedPlanText.includes("git push")) failures.push("Commit publication command was added.");
    if (/\bvercel\s+deploy\b/.test(combinedPlanText) || combinedPlanText.includes("vercel --prod")) failures.push("Vercel/deploy command was added.");
    if (combinedPlanText.includes("stripe live") || combinedPlanText.includes("production payment")) failures.push("Payment command or live payment wording was added.");
    if (combinedPlanText.includes("real keyboard writer enabled") || combinedPlanText.includes("real .sty export enabled") || combinedPlanText.includes("real .set export enabled")) failures.push("Writer/export enablement wording was added.");
    if (combinedPlanText.includes("app.jsx modification required")) failures.push("App.jsx modification is required by the plan.");
    if (packageJson.scripts["ai:factory:presentation-assets-final-plan"] !== "node scripts/uaos-ai-factory-presentation-assets-final-plan.mjs") failures.push("Package script ai:factory:presentation-assets-final-plan is missing or changed.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Presentation Assets Final Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Presentation Assets Final Plan Check: PASS");
  console.log("AI-016=DONE_LOCAL_PLAN_ONLY; checklist=LOCAL ONLY / STATIC LOCAL DEMO; remote unchanged");
} catch (error) {
  console.error("UAOS AI Factory Presentation Assets Final Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
