import fs from "node:fs";

const file = "generated/master/UAOS_AGENT_MASTER_EXPORT_PLAN.json";

if (!fs.existsSync(file)) {
  throw new Error(`Missing master export plan: ${file}`);
}

const master = JSON.parse(fs.readFileSync(file, "utf8"));

if (master.format !== "UAOS_AGENT_MASTER_EXPORT_PLAN") {
  throw new Error("Invalid master format.");
}

if (master.fileCount < 10) {
  throw new Error(`Master fileCount too low: ${master.fileCount}`);
}

if (master.summary.realBinaryExportReady !== false) {
  throw new Error("Master plan must not claim real binary readiness.");
}

if (!master.summary.hasOrchestratorPlan) {
  throw new Error("Missing orchestrator final prepared plan.");
}

if (!master.summary.hasFullOrchestration) {
  throw new Error("Missing full orchestration.");
}

if (!master.summary.hasQaResult) {
  throw new Error("Missing QA result.");
}

console.log(`OK master fileCount: ${master.fileCount}`);
console.log("PHASE 48 AGENT FILE AGGREGATOR CHECK PASS");
