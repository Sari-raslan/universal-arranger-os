import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const expectedOrigin = "https://github.com/Sari-raslan/universal-arranger-os.git";
const plannedTarget = "https://github.com/aeplatform-app/universal-arranger-os.git";

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
    "uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/EXECUTION_PACKET.json",
    "uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/GITHUB_TRANSFER_READINESS_AUDIT.md",
    "uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/TRANSFER_RISK_CHECKLIST.md",
    "uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/GITHUB_TRANSFER_READINESS_POLICY.md",
    "uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/BRANCH_PROTECTION_TRANSFER_PLAN.md",
    "uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/SECRETS_VERCEL_DOMAIN_RISK.md",
    "uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/RESULT.md",
    "uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/NEXT_ACTIONS.md",
    "uaos-ai-factory/platform/github-transfer/GITHUB_TRANSFER_TARGET.json",
    "uaos-ai-factory/platform/github-transfer/GITHUB_TRANSFER_READINESS_POLICY.md",
    "uaos-ai-factory/platform/github-transfer/TRANSFER_READINESS_CHECKLIST.json",
    "uaos-ai-factory/platform/github-transfer/TRANSFER_STOP_RULES.json",
    "uaos-ai-factory/reports/AI_FACTORY_STAGE13_AI010_GITHUB_TRANSFER_READINESS_AUDIT_REPORT.md"
  ];

  requiredFiles.forEach(requireFile);

  if (failures.length === 0) {
    const packet = readJson("uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/EXECUTION_PACKET.json");
    const target = readJson("uaos-ai-factory/platform/github-transfer/GITHUB_TRANSFER_TARGET.json");
    const checklist = readJson("uaos-ai-factory/platform/github-transfer/TRANSFER_READINESS_CHECKLIST.json");
    const stops = readJson("uaos-ai-factory/platform/github-transfer/TRANSFER_STOP_RULES.json");
    const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
    const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
    const packageJson = readJson("package.json");
    const ai010 = queue.tasks.find((task) => task.id === "AI-010");
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";
    const audit = readText("uaos-ai-factory/executions/AI-010-github-transfer-readiness-audit/GITHUB_TRANSFER_READINESS_AUDIT.md");
    const combinedPlanText = requiredFiles
      .filter((file) => file.endsWith(".md") || file.endsWith(".json"))
      .map((file) => readText(file))
      .join("\n")
      .toLowerCase();

    if (packet.status !== "DONE_LOCAL_PLAN_ONLY" || target.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-010 transfer readiness audit is not DONE_LOCAL_PLAN_ONLY.");
    if (!ai010 || ai010.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("TASK_QUEUE does not mark AI-010 DONE_LOCAL_PLAN_ONLY.");
    const phaseNumber = Number(String(state.phase || "").match(/LOCAL_EXECUTION_STAGE_(\d+)/)?.[1] || 0);
    if (phaseNumber < 13 || state.githubTransferReadinessAuditStatus !== "DONE_LOCAL_PLAN_ONLY") failures.push("AUTOPILOT_STATE does not mark Stage 13 complete.");
    if (target.currentOrigin !== expectedOrigin || packet.currentOriginMustRemain !== expectedOrigin) failures.push("Current origin value is not the expected Sari-raslan repository.");
    if (target.plannedFutureTarget !== plannedTarget || packet.plannedFutureTargetOnly !== plannedTarget) failures.push("Planned target value is not the AE Platform repository.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Local git config origin URL is not unchanged.");
    if (target.remoteChanged !== false || target.remoteChangeAllowed !== false || packet.remoteChanged !== false) failures.push("Remote change must remain false.");
    if (target.transferPerformed !== false || packet.transferPerformed !== false) failures.push("Transfer must remain false.");
    if (target.pushAllowed !== false || packet.pushPerformed !== false || state.pushAllowed !== false) failures.push("Commit publication must remain blocked.");
    if (target.deployAllowed !== false || packet.deployPerformed !== false || state.deployAllowed !== false) failures.push("Deploy must remain blocked.");
    if (target.paymentAllowed !== false || state.paymentAllowed !== false) failures.push("Payment must remain blocked.");
    if (target.realWriterAllowed !== false || state.realWriterAllowed !== false) failures.push("Writer/export must remain blocked.");
    if (target.externalAutomationReady !== false || packet.externalAutomationReady !== false || state.externalAutomationReady !== false) failures.push("External automation must remain disabled.");
    if (checklist.adminEmail !== "admin@aeplatform.app") failures.push("Admin email is not documented.");
    if (checklist.vercelIntegrationRisk !== "blocked until approved") failures.push("Vercel integration risk is not blocked.");
    if (!stops.stopOnRemoteChangeRequest || !stops.stopOnRepositoryTransferRequest || !stops.stopOnExternalAutomationRequest) failures.push("Transfer stop rules are incomplete.");
    if (!audit.includes("git remote -v") || !audit.includes("git --no-pager log --oneline -14") || !audit.includes("git status --short") || !audit.includes("git ls-remote https://github.com/aeplatform-app/universal-arranger-os.git HEAD")) failures.push("Owner manual verification commands are incomplete.");
    if (combinedPlanText.includes("git remote set-url")) failures.push("Remote change command was added.");
    if (combinedPlanText.includes("git push")) failures.push("Commit publication command was added.");
    if (combinedPlanText.includes("vercel deploy") || combinedPlanText.includes("vercel --prod")) failures.push("Vercel/deploy command was added.");
    if (combinedPlanText.includes("stripe live") || combinedPlanText.includes("production payment")) failures.push("Payment command or live payment wording was added.");
    if (combinedPlanText.includes("app.jsx modification required")) failures.push("App.jsx modification is required by the plan.");
    if (packageJson.scripts["ai:factory:transfer-readiness-plan"] !== "node scripts/uaos-ai-factory-transfer-readiness-plan.mjs") failures.push("Package script ai:factory:transfer-readiness-plan is missing or changed.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Transfer Readiness Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Transfer Readiness Plan Check: PASS");
  console.log("AI-010=DONE_LOCAL_PLAN_ONLY; origin=Sari-raslan/universal-arranger-os; target readiness=manual only");
} catch (error) {
  console.error("UAOS AI Factory Transfer Readiness Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
