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

function requireBlocked(value, label) {
  if (value !== false && value !== "BLOCKED") failures.push(`${label} is not blocked.`);
}

try {
  const requiredFiles = [
    "uaos-ai-factory/FINAL_LOCAL_FACTORY_FREEZE.json",
    "uaos-ai-factory/agents/local-bounded-agent-queue.json",
    "uaos-ai-factory/agents/reports/AGENT_A_PROJECT_DOCS_CONSOLIDATION_REPORT.md",
    "uaos-ai-factory/agents/reports/AGENT_B_UI_COPY_SPEC_CLEANUP_REPORT.md",
    "uaos-ai-factory/agents/reports/AGENT_C_DEMO_CHECKLIST_REPORT_CLEANUP_REPORT.md",
    "uaos-ai-factory/agents/reports/AGENT_D_PREMIUM_LIBRARY_METADATA_PLANNING_REPORT.md"
  ];

  requiredFiles.forEach(requireFile);

  if (failures.length === 0) {
    const freeze = readJson("uaos-ai-factory/FINAL_LOCAL_FACTORY_FREEZE.json");
    const queue = readJson("uaos-ai-factory/agents/local-bounded-agent-queue.json");
    const packageJson = readJson("package.json");
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";
    const combinedQueueText = JSON.stringify(queue).toLowerCase();

    if (freeze.status !== "FINAL_LOCAL_FACTORY_FREEZE") failures.push("Final local factory freeze is not active.");
    if (freeze.mode !== "LOCAL_ONLY") failures.push("Final freeze mode is not LOCAL_ONLY.");
    if (freeze.externalAutomation !== "BLOCKED") failures.push("External automation is not BLOCKED in final freeze.");

    requireBlocked(queue.rules?.appJsxAllowed, "Queue App.jsx");
    requireBlocked(queue.rules?.pushAllowed, "Queue push");
    requireBlocked(queue.rules?.deployAllowed, "Queue deploy");
    requireBlocked(queue.rules?.vercelAllowed, "Queue Vercel");
    requireBlocked(queue.rules?.paymentAllowed, "Queue payment");
    requireBlocked(queue.rules?.realKeyboardWriterExportAllowed, "Queue real keyboard writer/export");
    requireBlocked(queue.rules?.proprietaryAssetsAllowed, "Queue proprietary sample/library copying");

    for (const task of queue.tasks || []) {
      if (task.appJsxAllowed !== false) failures.push(`${task.id} allows App.jsx.`);
      if (task.pushAllowed !== false) failures.push(`${task.id} allows push.`);
      if (task.deployAllowed !== false) failures.push(`${task.id} allows deploy.`);
      if (task.vercelAllowed !== false) failures.push(`${task.id} allows Vercel.`);
      if (!Array.isArray(task.forbiddenFilesFolders) || !task.forbiddenFilesFolders.some((item) => item.includes("App.jsx"))) {
        failures.push(`${task.id} does not explicitly forbid App.jsx.`);
      }
    }

    if (!combinedQueueText.includes("samples") && !combinedQueueText.includes("proprietary")) failures.push("Queue does not mention sample/proprietary restrictions.");
    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Current remote is not the expected Sari-raslan repository.");
    if (packageJson.scripts["ai:factory:agent-queue-check"] !== "node scripts/uaos-ai-factory-agent-queue-check.mjs") failures.push("Package script ai:factory:agent-queue-check is missing.");

    const commandText = [JSON.stringify(freeze), JSON.stringify(queue)].join("\n").toLowerCase();
    if (commandText.includes("git push")) failures.push("Push command was added.");
    if (/\bvercel\s+deploy\b/.test(commandText) || commandText.includes("vercel --prod") || commandText.includes("npx vercel")) failures.push("Vercel/deploy command was added.");
    if (commandText.includes("stripe live") || commandText.includes("production payment")) failures.push("Payment command was added.");
    if (commandText.includes("real keyboard writer enabled") || commandText.includes("real .sty export enabled") || commandText.includes("real .set export enabled")) failures.push("Writer/export enablement wording was added.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory Agent Queue Check: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory Agent Queue Check: PASS");
  console.log("Freeze active; Agent A-D reports present; queue gates blocked; remote unchanged");
} catch (error) {
  console.error("UAOS AI Factory Agent Queue Check: FAIL");
  console.error(error.message);
  process.exit(1);
}
