export const UAOS_KETRON_AGENT_VERSION = "46.0.0";

export function runKetronAgent(input = {}) {
  return {
    agent: "KetronAgent",
    version: UAOS_KETRON_AGENT_VERSION,
    target: "ketron",
    devices: ["SD9", "SD90", "Audya"],
    preparedFiles: [
      "ketron-style-map.plan.json",
      "ketron-audio-drum-reference.plan.json",
      "ketron-package.plan.json"
    ],
    plan: {
      futureFormats: [".PAT", ".MSP", ".KST"],
      sectionMap: {
        intro: ["intro"],
        arranger: ["arrA", "arrB", "arrC", "arrD"],
        fill: ["fill"],
        break: ["break"],
        ending: ["ending"]
      },
      audioDrumReference: true,
      sourceProject: input.projectName || "UAOS Agent Prepared Project"
    },
    realBinaryReady: false,
    status: "prepared"
  };
}
