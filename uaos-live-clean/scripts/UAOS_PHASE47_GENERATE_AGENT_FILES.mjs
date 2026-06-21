import fs from "node:fs";
import path from "node:path";
import { runUaosAgentOrchestrator } from "../src/agents/orchestrator/uaosAgentOrchestrator.js";

const outRoot = path.resolve("generated/agents");
fs.mkdirSync(outRoot, { recursive: true });

const result = runUaosAgentOrchestrator({
  projectName: "UAOS Phase 47 Generated Agent Files",
  tempo: 104,
  key: "D minor",
  chordProgression: ["Dm", "Bb", "Gm", "A7"]
});

if (!result.ok) {
  throw new Error(result.qa.errors.join(", "));
}

const writeJson = (file, data) => {
  const full = path.join(outRoot, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${file}`);
};

writeJson("orchestrator/final-prepared-plan.json", result.finalPreparedPlan);
writeJson("orchestrator/full-orchestration.json", result);
writeJson("qa/qa-result.json", result.qa);

for (const output of result.outputs) {
  const safeName = output.agent.replace(/Agent$/, "").toLowerCase();
  writeJson(`${safeName}/${safeName}-agent-output.json`, output);

  if (Array.isArray(output.preparedFiles)) {
    for (const file of output.preparedFiles) {
      writeJson(`${safeName}/${file}`, {
        generatedBy: output.agent,
        phase: 47,
        file,
        status: "prepared",
        realBinaryReady: false,
        sourceOutput: output
      });
    }
  }
}

console.log("PHASE 47 AGENT FILE GENERATION PASS");
