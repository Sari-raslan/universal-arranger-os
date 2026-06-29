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
    "uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/EXECUTION_PACKET.json",
    "uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/STATIC_DEMO_GATEWAY_SAFETY_HANDOFF.md",
    "uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/GATEWAY_SAFETY_POLICY.md",
    "uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/GATEWAY_HANDOFF_CHECKLIST.md",
    "uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/LOCAL_GATEWAY_FILE_CONTEXT.md",
    "uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/SCREENSHOT_PRESENTATION_GUIDE.md",
    "uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/RESULT.md",
    "uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/NEXT_ACTIONS.md",
    "uaos-ai-factory/platform/static-demo-gateway/STATIC_GATEWAY_TARGET.json",
    "uaos-ai-factory/platform/static-demo-gateway/STATIC_GATEWAY_SAFETY_POLICY.md",
    "uaos-ai-factory/reports/AI_FACTORY_STAGE15_AI012_STATIC_DEMO_GATEWAY_SAFETY_HANDOFF_REPORT.md"
  ];
  const gatewayFiles = [
    "public/index.html",
    "public/status-ar.html",
    "uaos-public-preview/index.html",
    "uaos-public-preview/PUBLIC_PREVIEW_STATUS.md"
  ];

  [...requiredFiles, ...gatewayFiles].forEach(requireFile);

  if (failures.length === 0) {
    const packet = readJson("uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/EXECUTION_PACKET.json");
    const target = readJson("uaos-ai-factory/platform/static-demo-gateway/STATIC_GATEWAY_TARGET.json");
    const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
    const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
    const packageJson = readJson("package.json");
    const ai012 = queue.tasks.find((task) => task.id === "AI-012");
    const safetyDoc = readText("uaos-ai-factory/executions/AI-012-static-demo-gateway-safety-handoff/STATIC_DEMO_GATEWAY_SAFETY_HANDOFF.md");
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";
    const combinedPlanText = requiredFiles
      .filter((file) => file.endsWith(".md") || file.endsWith(".json"))
      .map((file) => readText(file))
      .join("\n")
      .toLowerCase();

    if (packet.status !== "DONE_LOCAL_PLAN_ONLY" || target.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("AI-012 static gateway safety handoff is not DONE_LOCAL_PLAN_ONLY.");
    if (!ai012 || ai012.status !== "DONE_LOCAL_PLAN_ONLY") failures.push("TASK_QUEUE does not mark AI-012 DONE_LOCAL_PLAN_ONLY.");
    const phaseNumber = Number(String(state.phase || "").match(/LOCAL_EXECUTION_STAGE_(\d+)/)?.[1] || 0);
    if (phaseNumber < 15 || state.staticDemoGatewaySafetyHandoffStatus !== "DONE_LOCAL_PLAN_ONLY") failures.push("AUTOPILOT_STATE does not mark Stage 15 complete.");
    if (!safetyDoc.includes("LOCAL ONLY") || !safetyDoc.includes("NOT PUBLIC RELEASE")) failures.push("Gateway language is not clearly marked local-only and not public release.");
    if (target.releaseType !== "LOCAL ONLY - NOT PUBLIC RELEASE" || packet.releaseType !== "LOCAL ONLY - NOT PUBLIC RELEASE") failures.push("Release type marker is incorrect.");
    if (target.currentOrigin !== expectedOrigin || packet.currentOriginMustRemain !== expectedOrigin) failures.push("Current origin value is not the expected Sari-raslan repository.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Local git config origin URL is not unchanged.");
    if (target.vercelCommandRun !== false || packet.vercelCommandRun !== false) failures.push("Vercel command state must remain false.");
    if (target.pushAllowed !== false || packet.pushPerformed !== false || state.pushAllowed !== false) failures.push("Commit publication must remain blocked.");
    if (target.deployAllowed !== false || packet.deployPerformed !== false || state.deployAllowed !== false) failures.push("Deploy must remain blocked.");
    if (target.paymentAllowed !== false || packet.paymentActionPerformed !== false || state.paymentAllowed !== false) failures.push("Payment must remain blocked.");
    if (target.realWriterAllowed !== false || packet.realWriterExportCreated !== false || state.realWriterAllowed !== false) failures.push("Writer/export must remain blocked.");
    if (target.externalAutomationReady !== false || packet.externalAutomationReady !== false || state.externalAutomationReady !== false) failures.push("External automation must remain disabled.");
    if (target.githubTransferCompleted !== false) failures.push("GitHub transfer must remain incomplete.");
    if (combinedPlanText.includes("git push")) failures.push("Commit publication command was added.");
    if (/\bvercel\s+deploy\b/.test(combinedPlanText) || combinedPlanText.includes("vercel --prod")) failures.push("Vercel/deploy command was added.");
    if (combinedPlanText.includes("stripe live") || combinedPlanText.includes("production payment")) failures.push("Payment command or live payment wording was added.");
    if (combinedPlanText.includes("real keyboard writer enabled") || combinedPlanText.includes("real .sty export enabled") || combinedPlanText.includes("real .set export enabled")) failures.push("Writer/export enablement wording was added.");
    if (combinedPlanText.includes("app.jsx modification required")) failures.push("App.jsx modification is required by the plan.");
    if (packageJson.scripts["ai:factory:static-gateway-safety-plan"] !== "node scripts/uaos-ai-factory-static-gateway-safety-plan.mjs") failures.push("Package script ai:factory:static-gateway-safety-plan is missing or changed.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Static Gateway Safety Plan Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Static Gateway Safety Plan Check: PASS");
  console.log("AI-012=DONE_LOCAL_PLAN_ONLY; gateway=LOCAL ONLY - NOT PUBLIC RELEASE; remote unchanged");
} catch (error) {
  console.error("UAOS AI Factory Static Gateway Safety Plan Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
