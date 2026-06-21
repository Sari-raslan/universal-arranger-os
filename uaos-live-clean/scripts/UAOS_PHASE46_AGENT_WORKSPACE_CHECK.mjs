import { runUaosAgentOrchestrator } from "../src/agents/orchestrator/uaosAgentOrchestrator.js";

const result = runUaosAgentOrchestrator({
  projectName: "UAOS Phase 46 Agent Workspace",
  tempo: 100,
  key: "D minor",
  chordProgression: ["Dm", "Bb", "Gm", "A7"]
});

if (!result.ok) {
  throw new Error(result.qa.errors.join(", "));
}

if (result.realBinaryReady !== false) {
  throw new Error("Orchestrator must not claim real binary readiness.");
}

if (result.outputs.length < 7) {
  throw new Error("Expected at least 7 agent outputs.");
}

const required = ["StyleAgent", "MidiAgent", "KorgAgent", "YamahaAgent", "RolandAgent", "KetronAgent", "BinaryAgent"];
for (const name of required) {
  if (!result.outputs.find(x => x.agent === name)) {
    throw new Error(`Missing agent: ${name}`);
  }
  console.log(`OK ${name}`);
}

console.log("PHASE 46 AGENT WORKSPACE CHECK PASS");
