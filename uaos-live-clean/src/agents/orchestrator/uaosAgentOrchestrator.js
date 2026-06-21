import { runKorgAgent } from "../korg/korgAgent.js";
import { runYamahaAgent } from "../yamaha/yamahaAgent.js";
import { runRolandAgent } from "../roland/rolandAgent.js";
import { runKetronAgent } from "../ketron/ketronAgent.js";
import { runMidiAgent } from "../midi/midiAgent.js";
import { runStyleAgent } from "../style/styleAgent.js";
import { runBinaryAgent } from "../binary/binaryAgent.js";
import { runQaAgent } from "../qa/qaAgent.js";

export const UAOS_AGENT_ORCHESTRATOR_VERSION = "46.0.0";

export function runUaosAgentOrchestrator(input = {}) {
  const style = runStyleAgent(input);
  const midi = runMidiAgent({
    tempo: input.tempo || 96,
    meter: input.meter || "4/4",
    sections: style.stylePlan.sections
  });

  const deviceAgents = [
    runKorgAgent(input),
    runYamahaAgent(input),
    runRolandAgent(input),
    runKetronAgent(input)
  ];

  const binary = runBinaryAgent({ target: "all" });

  const outputs = [style, midi, ...deviceAgents, binary];
  const qa = runQaAgent(outputs);

  return {
    format: "UAOS_AGENT_WORKSPACE_ORCHESTRATION",
    version: UAOS_AGENT_ORCHESTRATOR_VERSION,
    ok: qa.ok,
    projectName: input.projectName || "UAOS Agent Workspace Project",
    outputs,
    qa,
    finalPreparedPlan: {
      devices: deviceAgents.map(x => ({
        agent: x.agent,
        target: x.target,
        devices: x.devices,
        futureFormats: x.plan.futureFormats,
        preparedFiles: x.preparedFiles
      })),
      stylePlan: style.stylePlan,
      midiReference: midi.midiReference,
      binaryPlan: binary.binaryPlan
    },
    realBinaryReady: false
  };
}
