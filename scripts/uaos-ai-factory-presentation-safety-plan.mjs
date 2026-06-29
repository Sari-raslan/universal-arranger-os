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
  return !/\b(no|not|must not|do not|avoid|without|prohibited|blocked)\b/.test(window);
}

try {
  const requiredFiles = [
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/EXECUTION_PACKET.json",
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/PRESENTATION_SAFETY_PLAN.md",
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/PRESENTATION_CLAIMS_POLICY.md",
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/JOBCENTER_PRESENTATION_CHECKLIST.md",
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/SUPPORTER_FRIEND_CHECKLIST.md",
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/PRESENTATION_WORDING_GUIDE.md",
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/FUNDING_MILESTONE_BOUNDARIES.md",
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/RESULT.md",
    "uaos-ai-factory/executions/AI-013-presentation-safety-plan/NEXT_ACTIONS.md",
    "uaos-ai-factory/platform/presentation-safety/PRESENTATION_SAFETY_TARGET.json",
    "uaos-ai-factory/platform/presentation-safety/PRESENTATION_CLAIMS_SAFETY_POLICY.md",
    "uaos-ai-factory/reports/AI_FACTORY_STAGE16_AI013_JOBCENTER_SUPPORTER_PRESENTATION_SAFETY_PLAN_REPORT.md"
  ];

  requiredFiles.forEach(requireFile);

  if (failures.length === 0) {
    const packet = readJson("uaos-ai-factory/executions/AI-013-presentation-safety-plan/EXECUTION_PACKET.json");
    const target = readJson("uaos-ai-factory/platform/presentation-safety/PRESENTATION_SAFETY_TARGET.json");
    const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
    const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
    const packageJson = readJson("package.json");
    const ai013 = queue.tasks.find((task) => task.id === "AI-013");
    const safetyDoc = readText("uaos-ai-factory/executions/AI-013-presentation-safety-plan/PRESENTATION_SAFETY_PLAN.md");
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";
    const combinedPlanText = requiredFiles
      .filter((file) => file.endsWith(".md") || file.endsWith(".json"))
      .map((file) => readText(file))
      .join("\n")
      .toLowerCase();

    if (packet.status !== "DONE_LOCAL_PLAN_ONLY" || target.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-013 presentation safety plan is not DONE_LOCAL_PLAN_ONLY.");
    if (!ai013 || ai013.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("TASK_QUEUE does not mark AI-013 DONE_LOCAL_PLAN_ONLY.");
    const phaseNumber = Number(String(state.phase || "").match(/LOCAL_EXECUTION_STAGE_(\d+)/)?.[1] || 0);
    if (phaseNumber < 16 || state.presentationSafetyPlanStatus !== "DONE_LOCAL_PLAN_ONLY") failures.push("AUTOPILOT_STATE does not mark Stage 16 complete.");
    if (!safetyDoc.includes("LOCAL ONLY") || !safetyDoc.includes("NOT PUBLIC RELEASE")) failures.push("Presentation language is not clearly marked local-only and not public release.");
    if (target.releaseType !== "LOCAL ONLY - NOT PUBLIC RELEASE" || packet.releaseType !== "LOCAL ONLY - NOT PUBLIC RELEASE") failures.push("Release type marker is incorrect.");
    if (target.currentOrigin !== expectedOrigin || packet.currentOriginMustRemain !== expectedOrigin) failures.push("Current origin value is not the expected Sari-raslan repository.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Local git config origin URL is not unchanged.");
    if (target.publicLaunchClaimAllowed !== false || packet.publicLaunchClaimAllowed !== false) failures.push("Public launch claims must remain disallowed.");
    if (target.paymentOrLiveCustomerClaimAllowed !== false || packet.paymentOrLiveCustomerClaimAllowed !== false) failures.push("Payment/live customer claims must remain disallowed.");
    if (target.realKeyboardExportClaimAllowed !== false || packet.realKeyboardExportClaimAllowed !== false) failures.push("Real keyboard export claims must remain disallowed.");
    if (target.proprietaryLibraryOwnershipClaimAllowed !== false || packet.proprietaryLibraryOwnershipClaimAllowed !== false) failures.push("Proprietary library/sample claims must remain disallowed.");
    if (target.pushAllowed !== false || packet.pushPerformed !== false || state.pushAllowed !== false) failures.push("Commit publication must remain blocked.");
    if (target.deployAllowed !== false || packet.deployPerformed !== false || state.deployAllowed !== false) failures.push("Deploy must remain blocked.");
    if (target.paymentAllowed !== false || packet.paymentActionPerformed !== false || state.paymentAllowed !== false) failures.push("Payment must remain blocked.");
    if (target.realWriterAllowed !== false || packet.realWriterExportCreated !== false || state.realWriterAllowed !== false) failures.push("Writer/export must remain blocked.");
    if (target.externalAutomationReady !== false || packet.externalAutomationReady !== false || state.externalAutomationReady !== false) failures.push("External automation must remain disabled.");
    if (target.githubTransferCompleted !== false) failures.push("GitHub transfer must remain incomplete.");
    if (hasUnsafeClaim(combinedPlanText, "public launch")) failures.push("Unsafe public launch claim found.");
    if (hasUnsafeClaim(combinedPlanText, "live customer")) failures.push("Unsafe live customer claim found.");
    if (hasUnsafeClaim(combinedPlanText, "payment readiness")) failures.push("Unsafe payment readiness claim found.");
    if (hasUnsafeClaim(combinedPlanText, "real keyboard export")) failures.push("Unsafe real keyboard export claim found.");
    if (hasUnsafeClaim(combinedPlanText, "real keyboard writer")) failures.push("Unsafe real keyboard writer claim found.");
    if (hasUnsafeClaim(combinedPlanText, "proprietary sample ownership")) failures.push("Unsafe proprietary sample ownership claim found.");
    if (hasUnsafeClaim(combinedPlanText, "proprietary library ownership")) failures.push("Unsafe proprietary library ownership claim found.");
    if (combinedPlanText.includes("git push")) failures.push("Commit publication command was added.");
    if (/\bvercel\s+deploy\b/.test(combinedPlanText) || combinedPlanText.includes("vercel --prod")) failures.push("Vercel/deploy command was added.");
    if (combinedPlanText.includes("stripe live") || combinedPlanText.includes("production payment")) failures.push("Payment command or live payment wording was added.");
    if (combinedPlanText.includes("real keyboard writer enabled") || combinedPlanText.includes("real .sty export enabled") || combinedPlanText.includes("real .set export enabled")) failures.push("Writer/export enablement wording was added.");
    if (combinedPlanText.includes("app.jsx modification required")) failures.push("App.jsx modification is required by the plan.");
    if (packageJson.scripts["ai:factory:presentation-safety-plan"] !== "node scripts/uaos-ai-factory-presentation-safety-plan.mjs") failures.push("Package script ai:factory:presentation-safety-plan is missing or changed.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Presentation Safety Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Presentation Safety Plan Check: PASS");
  console.log("AI-013=DONE_LOCAL_PLAN_ONLY; claims=LOCAL ONLY - NOT PUBLIC RELEASE; remote unchanged");
} catch (error) {
  console.error("UAOS AI Factory Presentation Safety Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
