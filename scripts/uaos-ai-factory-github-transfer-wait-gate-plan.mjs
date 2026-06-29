import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const expectedOrigin = "https://github.com/Sari-raslan/universal-arranger-os.git";
const targetCommand = "git ls-remote https://github.com/aeplatform-app/universal-arranger-os.git HEAD";

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
    "uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/EXECUTION_PACKET.json",
    "uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/NO_PUSH_FREEZE_POLICY.md",
    "uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/OWNER_MANUAL_VERIFICATION_CHECKLIST.md",
    "uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/TRANSFER_WAIT_DECISION_MATRIX.md",
    "uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/FREEZE_STATUS_SUMMARY.md",
    "uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/RESULT.md",
    "uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/NEXT_ACTIONS.md",
    "uaos-ai-factory/platform/github-transfer-wait-gate/GITHUB_TRANSFER_WAIT_GATE_TARGET.json",
    "uaos-ai-factory/platform/github-transfer-wait-gate/NO_PUSH_FREEZE_POLICY.md",
    "uaos-ai-factory/reports/AI_FACTORY_STAGE20_AI017_GITHUB_TRANSFER_WAIT_GATE_NO_PUSH_FREEZE_REPORT.md"
  ];

  requiredFiles.forEach(requireFile);

  if (failures.length === 0) {
    const packet = readJson("uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/EXECUTION_PACKET.json");
    const target = readJson("uaos-ai-factory/platform/github-transfer-wait-gate/GITHUB_TRANSFER_WAIT_GATE_TARGET.json");
    const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
    const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
    const packageJson = readJson("package.json");
    const ai017 = queue.tasks.find((task) => task.id === "AI-017");
    const policy = readText("uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/NO_PUSH_FREEZE_POLICY.md");
    const manualChecklist = readText("uaos-ai-factory/executions/AI-017-github-transfer-wait-gate/OWNER_MANUAL_VERIFICATION_CHECKLIST.md");
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";
    const combinedPlanText = requiredFiles
      .filter((file) => file.endsWith(".md") || file.endsWith(".json"))
      .map((file) => readText(file))
      .join("\n")
      .toLowerCase();

    if (packet.status !== "DONE_LOCAL_PLAN_ONLY" || target.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-017 wait gate is not DONE_LOCAL_PLAN_ONLY.");
    if (!ai017 || ai017.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("TASK_QUEUE does not mark AI-017 DONE_LOCAL_PLAN_ONLY.");
    const stageNumber = Number(String(state.phase || "").replace("LOCAL_EXECUTION_STAGE_", ""));
    if (stageNumber < 20 || state.githubTransferWaitGateStatus !== "DONE_LOCAL_PLAN_ONLY") failures.push("AUTOPILOT_STATE does not mark Stage 20 complete.");
    if (!policy.includes("NO PUSH") || !policy.includes("NO DEPLOY") || !policy.includes("NO VERCEL")) failures.push("Freeze policy does not include NO PUSH / NO DEPLOY / NO VERCEL.");
    if (!manualChecklist.includes(targetCommand) || target.targetReadinessCommand !== targetCommand) failures.push("Target readiness command is not documented.");
    if (target.targetReadinessCommandExecuted !== false || packet.targetReadinessCommandExecuted !== false) failures.push("Target readiness command must not be executed by this plan.");
    if (target.currentOrigin !== expectedOrigin || packet.currentOriginMustRemain !== expectedOrigin) failures.push("Current origin value is not the expected Sari-raslan repository.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Local git config origin URL is not unchanged.");
    if (target.remoteChanged !== false || packet.remoteChanged !== false || state.remoteChangeAllowed !== false) failures.push("Remote change must remain false.");
    if (target.transferPerformed !== false || packet.transferPerformed !== false) failures.push("Transfer must remain false.");
    if (target.pushAllowed !== false || packet.pushPerformed !== false || state.pushAllowed !== false) failures.push("Push must remain blocked.");
    if (target.deployAllowed !== false || packet.deployPerformed !== false || state.deployAllowed !== false) failures.push("Deploy must remain blocked.");
    if (target.vercelAllowed !== false || packet.vercelCommandRun !== false) failures.push("Vercel must remain blocked.");
    if (target.paymentAllowed !== false || packet.paymentActionPerformed !== false || state.paymentAllowed !== false) failures.push("Payment must remain blocked.");
    if (target.realWriterAllowed !== false || packet.realWriterExportCreated !== false || state.realWriterAllowed !== false) failures.push("Writer/export must remain blocked.");
    if (target.externalAutomationReady !== false || packet.externalAutomationReady !== false || state.externalAutomationReady !== false) failures.push("External automation must remain disabled.");
    const commandFreeText = combinedPlanText.replace(targetCommand.toLowerCase(), "");
    if (commandFreeText.includes("git push")) failures.push("Push command was added.");
    if (/\bvercel\s+deploy\b/.test(commandFreeText) || commandFreeText.includes("vercel --prod")) failures.push("Vercel/deploy command was added.");
    if (commandFreeText.includes("stripe live") || commandFreeText.includes("production payment")) failures.push("Payment command or live payment wording was added.");
    if (commandFreeText.includes("real keyboard writer enabled") || commandFreeText.includes("real .sty export enabled") || commandFreeText.includes("real .set export enabled")) failures.push("Writer/export enablement wording was added.");
    if (commandFreeText.includes("app.jsx modification required")) failures.push("App.jsx modification is required by the plan.");
    if (packageJson.scripts["ai:factory:github-transfer-wait-gate-plan"] !== "node scripts/uaos-ai-factory-github-transfer-wait-gate-plan.mjs") failures.push("Package script ai:factory:github-transfer-wait-gate-plan is missing or changed.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory GitHub Transfer Wait Gate Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory GitHub Transfer Wait Gate Plan Check: PASS");
  console.log("AI-017=DONE_LOCAL_PLAN_ONLY; freeze=NO PUSH / NO DEPLOY / NO VERCEL; remote unchanged");
} catch (error) {
  console.error("UAOS AI Factory GitHub Transfer Wait Gate Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
