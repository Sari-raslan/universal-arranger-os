export const UAOS_QA_AGENT_VERSION = "46.0.0";

export function runQaAgent(agentOutputs = []) {
  const errors = [];

  for (const output of agentOutputs) {
    if (!output?.agent) errors.push("Agent output missing agent name.");
    if (output?.realBinaryReady === true) errors.push(`${output.agent} must not claim real binary ready.`);
    if (output?.status !== "prepared") errors.push(`${output.agent} not prepared.`);
  }

  return {
    agent: "QaAgent",
    version: UAOS_QA_AGENT_VERSION,
    status: errors.length === 0 ? "prepared" : "failed",
    ok: errors.length === 0,
    errors,
    checkedAgents: agentOutputs.map(x => x.agent)
  };
}
