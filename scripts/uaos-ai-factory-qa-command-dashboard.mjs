import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const expectedOrigin = "https://github.com/Sari-raslan/universal-arranger-os.git";
const failures = [];

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

function requireFile(file, label) {
  if (!exists(file)) failures.push(`${label} missing: ${file}`);
}

function requireBlocked(value, label) {
  if (value !== "BLOCKED" && value !== false) failures.push(`${label} is not blocked.`);
}

try {
  const required = [
    ["uaos-ai-factory/FINAL_LOCAL_FACTORY_FREEZE.json", "FINAL_LOCAL_FACTORY_FREEZE"],
    ["uaos-ai-factory/agents/BOUNDED_LOCAL_AGENTS_COMPLETION_SEAL.json", "bounded agents completion seal"],
    ["uaos-ai-factory/implementation/NEXT_BOUNDED_IMPLEMENTATION_QUEUE.json", "implementation queue"],
    ["uaos-ai-factory/implementation/reports/IMPL_001_OWNER_DASHBOARD_README_POLISH_REPORT.md", "IMPL-001 report"],
    ["uaos-ai-factory/implementation/reports/IMPL_002_DEMO_GATEWAY_LINK_VALIDATION_REPORT.md", "IMPL-002 report"],
    ["uaos-ai-factory/implementation/reports/IMPL_003_PRESENTATION_SEND_PACK_ASSEMBLY_REPORT.md", "IMPL-003 report"]
  ];

  for (const [file, label] of required) requireFile(file, label);

  if (failures.length === 0) {
    const freeze = readJson("uaos-ai-factory/FINAL_LOCAL_FACTORY_FREEZE.json");
    const seal = readJson("uaos-ai-factory/agents/BOUNDED_LOCAL_AGENTS_COMPLETION_SEAL.json");
    const queue = readJson("uaos-ai-factory/implementation/NEXT_BOUNDED_IMPLEMENTATION_QUEUE.json");
    const packageJson = readJson("package.json");
    const gitConfig = exists(".git/config") ? readText(".git/config") : "";

    if (freeze.status !== "FINAL_LOCAL_FACTORY_FREEZE") failures.push("AI Factory final freeze is not active.");
    if (seal.status !== "BOUNDED_LOCAL_AGENTS_COMPLETE") failures.push("Bounded agents completion seal is not active.");
    if (queue.status !== "READY_LOCAL_ONLY") failures.push("Implementation queue is not READY_LOCAL_ONLY.");

    for (const gate of ["push", "deploy", "vercel", "payment", "realKeyboardWriterExport"]) {
      requireBlocked(queue.safetyGates?.[gate], `Implementation queue ${gate}`);
    }
    requireBlocked(queue.safetyGates?.proprietarySamplesLibrariesAudio, "Implementation queue proprietary sample/library copying");

    if (!gitConfig.includes(`url = ${expectedOrigin}`)) failures.push("Current remote is not the expected Sari-raslan repository.");
    if (packageJson.scripts["ai:factory:qa-command-dashboard"] !== "node scripts/uaos-ai-factory-qa-command-dashboard.mjs") failures.push("Package script ai:factory:qa-command-dashboard is missing.");

    const localPolicyText = [JSON.stringify(freeze), JSON.stringify(seal), JSON.stringify(queue)].join("\n").toLowerCase();
    if (localPolicyText.includes("git push")) failures.push("Push command appears in local policy text.");
    if (/\bvercel\s+deploy\b/.test(localPolicyText) || localPolicyText.includes("vercel --prod") || localPolicyText.includes("npx vercel")) failures.push("Vercel/deploy command appears in local policy text.");
    if (localPolicyText.includes("stripe live") || localPolicyText.includes("production payment")) failures.push("Payment command appears in local policy text.");
    if (localPolicyText.includes("real keyboard writer enabled") || localPolicyText.includes("real .sty export enabled") || localPolicyText.includes("real .set export enabled")) failures.push("Writer/export enablement wording appears in local policy text.");
  }

  if (failures.length > 0) {
    console.error("UAOS AI Factory QA Command Dashboard: FAIL");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("UAOS AI Factory QA Command Dashboard: PASS");
  console.log("Local checks visible:");
  console.log("- node scripts/uaos-ai-factory-safety-check.mjs");
  console.log("- npm run ai:factory:check");
  console.log("- npm run ai:factory:agent-queue-check");
  console.log("- npm run ai:factory:qa-command-dashboard");
  console.log("Blocked gates: push, deploy, Vercel, payment, writer/export, proprietary samples/libraries");
  console.log(`Remote unchanged: ${expectedOrigin}`);
} catch (error) {
  console.error("UAOS AI Factory QA Command Dashboard: FAIL");
  console.error(error.message);
  process.exit(1);
}
