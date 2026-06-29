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
    "uaos-ai-factory/FINAL_LOCAL_FACTORY_FREEZE.json",
    "uaos-ai-factory/agents/local-bounded-agent-queue.json",
    "uaos-ai-factory/agents/BOUNDED_LOCAL_AGENT_POLICY.md",
    "uaos-ai-factory/agents/AI018_FIRST_BOUNDED_AGENT_PACKET.md",
    "uaos-ai-factory/reports/AI_FACTORY_STAGE21_AI018_FINAL_LOCAL_FACTORY_FREEZE_AGENT_QUEUE_REPORT.md"
  ];

  requiredFiles.forEach(requireFile);

  if (failures.length === 0) {
    const freeze = readJson("uaos-ai-factory/FINAL_LOCAL_FACTORY_FREEZE.json");
    const agentQueue = readJson("uaos-ai-factory/agents/local-bounded-agent-queue.json");
    const state = readJson("uaos-ai-factory/autopilot/AUTOPILOT_STATE.json");
    const queue = readJson("uaos-ai-factory/autopilot/TASK_QUEUE.json");
    const packageJson = readJson("package.json");
    const packet = readText("uaos-ai-factory/agents/AI018_FIRST_BOUNDED_AGENT_PACKET.md");
    const policy = readText("uaos-ai-factory/agents/BOUNDED_LOCAL_AGENT_POLICY.md");
    const report = readText("uaos-ai-factory/reports/AI_FACTORY_STAGE21_AI018_FINAL_LOCAL_FACTORY_FREEZE_AGENT_QUEUE_REPORT.md");
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";
    const ai018 = queue.tasks.find((task) => task.id === "AI-018");

    if (freeze.status !== "FINAL_LOCAL_FACTORY_FREEZE") failures.push("Final freeze file does not mark FINAL_LOCAL_FACTORY_FREEZE.");
    if (freeze.mode !== "LOCAL_ONLY") failures.push("Final freeze file is not LOCAL_ONLY.");
    if (freeze.externalAutomation !== "BLOCKED") failures.push("External automation is not BLOCKED.");
    for (const gate of ["push", "deploy", "vercel", "payment", "writer"]) {
      if (freeze.safetyGates?.[gate] !== "BLOCKED") failures.push(`${gate} gate is not BLOCKED.`);
    }
    if (state.phase !== "LOCAL_EXECUTION_STAGE_21" || state.finalLocalFactoryFreezeStatus !== "FINAL_LOCAL_FACTORY_FREEZE") failures.push("AUTOPILOT_STATE does not mark AI-018 final freeze.");
    if (!ai018 || ai018.status !== "FINAL_LOCAL_FACTORY_FREEZE") failures.push("TASK_QUEUE does not mark AI-018 FINAL_LOCAL_FACTORY_FREEZE.");
    if (packageJson.scripts["ai:factory:final-freeze-agent-queue"] !== "node scripts/uaos-ai-factory-final-freeze-agent-queue.mjs") failures.push("Package script ai:factory:final-freeze-agent-queue is missing.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Current remote is not the expected Sari-raslan repository.");

    if (agentQueue.status !== "READY_LOCAL_ONLY" || agentQueue.externalAutomation !== "BLOCKED") failures.push("Agent queue is not local-only and blocked externally.");
    if (agentQueue.rules?.noTwentyFourHourAgents !== true) failures.push("No 24-hour agents rule is missing.");
    if (agentQueue.rules?.noOpenEndedAgents !== true) failures.push("No open-ended agents rule is missing.");
    if (agentQueue.rules?.oneSmallTaskAtATime !== true) failures.push("One-small-task-at-a-time rule is missing.");
    if (agentQueue.rules?.proprietaryAssetsAllowed !== false) failures.push("Proprietary assets are not blocked.");
    if (agentQueue.rules?.realKeyboardWriterExportAllowed !== false) failures.push("Real keyboard writer/export is not blocked.");
    if (agentQueue.rules?.appJsxAllowed !== false) failures.push("App.jsx is allowed at queue level.");

    const requiredAgents = ["Agent-A", "Agent-B", "Agent-C", "Agent-D", "Agent-E"];
    for (const agentId of requiredAgents) {
      const task = agentQueue.tasks.find((entry) => entry.id === agentId);
      if (!task) {
        failures.push(`${agentId} is missing from the bounded queue.`);
        continue;
      }
      if (!task.maxScope || !task.stopCondition || !task.reportPath) failures.push(`${agentId} is missing scope, stop condition, or report path.`);
      if (!Array.isArray(task.allowedFilesFolders) || task.allowedFilesFolders.length === 0) failures.push(`${agentId} has no allowed files/folders.`);
      if (!Array.isArray(task.forbiddenFilesFolders) || task.forbiddenFilesFolders.length === 0) failures.push(`${agentId} has no forbidden files/folders.`);
      if (task.appJsxAllowed !== false) failures.push(`${agentId} allows App.jsx.`);
      if (task.pushAllowed !== false) failures.push(`${agentId} allows push.`);
      if (task.deployAllowed !== false) failures.push(`${agentId} allows deploy.`);
      if (task.vercelAllowed !== false) failures.push(`${agentId} allows Vercel.`);
    }

    if (!packet.includes("Selected task: Agent A") || !packet.includes("No `uaos-live-clean/src/App.jsx`")) failures.push("First packet does not select Agent A with App.jsx blocked.");
    if (!policy.includes("No 24-hour agents") || !policy.includes("No open-ended agents") || !policy.includes("One small task at a time")) failures.push("Bounded agent policy is missing core rules.");
    if (!report.includes("FINAL_LOCAL_FACTORY_FREEZE")) failures.push("Stage 21 report does not mark final freeze.");

    const combinedText = [JSON.stringify(freeze), JSON.stringify(agentQueue), packet, policy, report].join("\n").toLowerCase();
    if (combinedText.includes("git push")) failures.push("Push command was added.");
    if (/\bvercel\s+deploy\b/.test(combinedText) || combinedText.includes("vercel --prod") || combinedText.includes("npx vercel")) failures.push("Vercel/deploy command was added.");
    if (combinedText.includes("stripe live") || combinedText.includes("production payment")) failures.push("Payment command was added.");
    if (combinedText.includes("app.jsx allowed\": true") || combinedText.includes("appjsxallowed\":true")) failures.push("App.jsx was allowed.");
    if (combinedText.includes("copy kontakt") || combinedText.includes("copy native instruments") || combinedText.includes("copy sample library")) failures.push("Proprietary sample/library copying is allowed.");
    if (combinedText.includes("real keyboard writer enabled") || combinedText.includes("real .sty export enabled") || combinedText.includes("real .set export enabled")) failures.push("Writer/export enablement wording was added.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Final Freeze Agent Queue Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Final Freeze Agent Queue Check: PASS");
  console.log("AI-018=FINAL_LOCAL_FACTORY_FREEZE; bounded local agent queue ready; external automation blocked");
} catch (error) {
  console.error("UAOS AI Factory Final Freeze Agent Queue Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
