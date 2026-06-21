import fs from "node:fs";

const required = [
  "generated/agents/orchestrator/final-prepared-plan.json",
  "generated/agents/orchestrator/full-orchestration.json",
  "generated/agents/qa/qa-result.json",
  "generated/agents/korg/korg-agent-output.json",
  "generated/agents/yamaha/yamaha-agent-output.json",
  "generated/agents/roland/roland-agent-output.json",
  "generated/agents/ketron/ketron-agent-output.json",
  "generated/agents/midi/midi-agent-output.json",
  "generated/agents/style/style-agent-output.json",
  "generated/agents/binary/binary-agent-output.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing generated file: ${file}`);
  }
  console.log(`OK ${file}`);
}

const plan = JSON.parse(fs.readFileSync("generated/agents/orchestrator/full-orchestration.json", "utf8"));

if (!plan.ok) throw new Error("Orchestration not ok.");
if (plan.realBinaryReady !== false) throw new Error("Must not claim real binary ready.");
if (!plan.finalPreparedPlan?.devices?.length) throw new Error("Missing prepared devices.");

console.log("PHASE 47 GENERATED AGENT FILES CHECK PASS");
