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
    "uaos-ai-factory/executions/AI-011-owner-handoff-plan/EXECUTION_PACKET.json",
    "uaos-ai-factory/executions/AI-011-owner-handoff-plan/LOCAL_RELEASE_NOTES_DRAFT.md",
    "uaos-ai-factory/executions/AI-011-owner-handoff-plan/OWNER_HANDOFF_CHECKLIST.md",
    "uaos-ai-factory/executions/AI-011-owner-handoff-plan/AI_FACTORY_STAGE_SUMMARY.md",
    "uaos-ai-factory/executions/AI-011-owner-handoff-plan/SAFETY_GATES_HANDOFF.md",
    "uaos-ai-factory/executions/AI-011-owner-handoff-plan/NEXT_DECISION_POINTS.md",
    "uaos-ai-factory/executions/AI-011-owner-handoff-plan/RESULT.md",
    "uaos-ai-factory/executions/AI-011-owner-handoff-plan/NEXT_ACTIONS.md",
    "uaos-ai-factory/platform/owner-handoff/OWNER_HANDOFF_TARGET.json",
    "uaos-ai-factory/platform/owner-handoff/OWNER_HANDOFF_POLICY.md",
    "uaos-ai-factory/reports/AI_FACTORY_STAGE14_AI011_OWNER_HANDOFF_PLAN_REPORT.md"
  ];

  requiredFiles.forEach(requireFile);

  if (failures.length === 0) {
    const packet = readJson("uaos-ai-factory/executions/AI-011-owner-handoff-plan/EXECUTION_PACKET.json");
    const target = readJson("uaos-ai-factory/platform/owner-handoff/OWNER_HANDOFF_TARGET.json");
    const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
    const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
    const packageJson = readJson("package.json");
    const ai011 = queue.tasks.find((task) => task.id === "AI-011");
    const notes = readText("uaos-ai-factory/executions/AI-011-owner-handoff-plan/LOCAL_RELEASE_NOTES_DRAFT.md");
    const checklist = readText("uaos-ai-factory/executions/AI-011-owner-handoff-plan/OWNER_HANDOFF_CHECKLIST.md").toLowerCase();
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";
    const combinedPlanText = requiredFiles
      .filter((file) => file.endsWith(".md") || file.endsWith(".json"))
      .map((file) => readText(file))
      .join("\n")
      .toLowerCase();

    if (packet.status !== "DONE_LOCAL_PLAN_ONLY" || target.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-011 owner handoff is not DONE_LOCAL_PLAN_ONLY.");
    if (!ai011 || ai011.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("TASK_QUEUE does not mark AI-011 DONE_LOCAL_PLAN_ONLY.");
    const phaseNumber = Number(String(state.phase || "").match(/LOCAL_EXECUTION_STAGE_(\d+)/)?.[1] || 0);
    if (phaseNumber < 14 || state.ownerHandoffPlanStatus !== "DONE_LOCAL_PLAN_ONLY") failures.push("AUTOPILOT_STATE does not mark Stage 14 complete.");
    if (!notes.includes("LOCAL ONLY") || !notes.includes("NOT PUBLIC RELEASE")) failures.push("Release notes are not clearly marked local-only and not public release.");
    if (target.releaseType !== "LOCAL ONLY - NOT PUBLIC RELEASE" || packet.releaseType !== "LOCAL ONLY - NOT PUBLIC RELEASE") failures.push("Release type marker is incorrect.");
    if (target.currentOrigin !== expectedOrigin || packet.currentOriginMustRemain !== expectedOrigin) failures.push("Current origin value is not the expected Sari-raslan repository.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Local git config origin URL is not unchanged.");
    if (target.githubTransferCompleted !== false || packet.githubTransferCompleted !== false) failures.push("GitHub transfer must remain incomplete.");
    if (target.pushAllowed !== false || packet.pushPerformed !== false || state.pushAllowed !== false) failures.push("Commit publication must remain blocked.");
    if (target.deployAllowed !== false || packet.deployPerformed !== false || state.deployAllowed !== false) failures.push("Deploy must remain blocked.");
    if (target.paymentAllowed !== false || packet.paymentActionPerformed !== false || state.paymentAllowed !== false) failures.push("Payment must remain blocked.");
    if (target.realWriterAllowed !== false || packet.realWriterExportCreated !== false || state.realWriterAllowed !== false) failures.push("Writer/export must remain blocked.");
    if (target.externalAutomationReady !== false || packet.externalAutomationReady !== false || state.externalAutomationReady !== false) failures.push("External automation must remain disabled.");
    if (!checklist.includes("origin/master gap") || !checklist.includes("code x/codex budget guard") || !checklist.includes("external automation remains blocked")) failures.push("Owner handoff checklist is incomplete.");
    if (combinedPlanText.includes("git push")) failures.push("Commit publication command was added.");
    if (combinedPlanText.includes("vercel deploy") || combinedPlanText.includes("vercel --prod")) failures.push("Vercel/deploy command was added.");
    if (combinedPlanText.includes("stripe live") || combinedPlanText.includes("production payment")) failures.push("Payment command or live payment wording was added.");
    if (combinedPlanText.includes("real keyboard writer enabled") || combinedPlanText.includes("real .sty export enabled") || combinedPlanText.includes("real .set export enabled")) failures.push("Writer/export enablement wording was added.");
    if (combinedPlanText.includes("app.jsx modification required")) failures.push("App.jsx modification is required by the plan.");
    if (packageJson.scripts["ai:factory:owner-handoff-plan"] !== "node scripts/uaos-ai-factory-owner-handoff-plan.mjs") failures.push("Package script ai:factory:owner-handoff-plan is missing or changed.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Owner Handoff Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Owner Handoff Plan Check: PASS");
  console.log("AI-011=DONE_LOCAL_PLAN_ONLY; release notes=LOCAL ONLY - NOT PUBLIC RELEASE; remote unchanged");
} catch (error) {
  console.error("UAOS AI Factory Owner Handoff Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
