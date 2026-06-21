import fs from "node:fs";
import path from "node:path";

const root = path.resolve("generated/agents");
const outDir = path.resolve("generated/master");
const outFile = path.join(outDir, "UAOS_AGENT_MASTER_EXPORT_PLAN.json");

fs.mkdirSync(outDir, { recursive: true });

function readJsonFiles(dir) {
  const files = [];

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...readJsonFiles(full));
    } else if (item.isFile() && item.name.endsWith(".json")) {
      files.push(full);
    }
  }

  return files;
}

const jsonFiles = readJsonFiles(root);

if (jsonFiles.length < 10) {
  throw new Error(`Expected at least 10 generated agent JSON files, found ${jsonFiles.length}`);
}

const entries = jsonFiles.map((file) => {
  const relativePath = path.relative(root, file).replaceAll("\\", "/");
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  return {
    relativePath,
    generatedBy: json.generatedBy || json.agent || json.format || "unknown",
    realBinaryReady: json.realBinaryReady === true ? true : false,
    data: json
  };
});

const unsafe = entries.filter((x) => x.realBinaryReady === true);
if (unsafe.length) {
  throw new Error(`Unsafe realBinaryReady claim found in: ${unsafe.map(x => x.relativePath).join(", ")}`);
}

const master = {
  format: "UAOS_AGENT_MASTER_EXPORT_PLAN",
  version: "48.0.0",
  createdAt: new Date().toISOString(),
  sourceFolder: "generated/agents",
  fileCount: entries.length,
  entries,
  summary: {
    agents: [...new Set(entries.map(x => x.generatedBy))].sort(),
    hasOrchestratorPlan: entries.some(x => x.relativePath === "orchestrator/final-prepared-plan.json"),
    hasFullOrchestration: entries.some(x => x.relativePath === "orchestrator/full-orchestration.json"),
    hasQaResult: entries.some(x => x.relativePath === "qa/qa-result.json"),
    realBinaryExportReady: false,
    currentLevel: "safe agent plans + JSON manifests + .uaosbin planning foundation"
  },
  warnings: [
    "This master plan aggregates prepared agent files only.",
    "It does not claim real proprietary keyboard binary export.",
    "Real .STY/.SET/.PRS export remains a separate engineering phase."
  ]
};

fs.writeFileSync(outFile, JSON.stringify(master, null, 2), "utf8");

console.log(`WROTE ${outFile}`);
console.log(`FILES ${entries.length}`);
console.log("PHASE 48 AGENT FILE AGGREGATOR PASS");
