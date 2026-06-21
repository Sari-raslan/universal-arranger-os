export const UAOS_YAMAHA_AGENT_VERSION = "46.0.0";

export function runYamahaAgent(input = {}) {
  return {
    agent: "YamahaAgent",
    version: UAOS_YAMAHA_AGENT_VERSION,
    target: "yamaha",
    devices: ["Genos", "Genos2", "SX900"],
    preparedFiles: [
      "yamaha-style-section.plan.json",
      "yamaha-ots-map.plan.json",
      "yamaha-style-container.plan.json"
    ],
    plan: {
      futureFormats: [".STY"],
      sectionMap: {
        intro: ["intro1", "intro2", "intro3"],
        main: ["mainA", "mainB", "mainC", "mainD"],
        fill: ["fillA", "fillB", "fillC", "fillD"],
        ending: ["ending1", "ending2", "ending3"]
      },
      otsMap: ["OTS1", "OTS2", "OTS3", "OTS4"],
      sourceProject: input.projectName || "UAOS Agent Prepared Project"
    },
    realBinaryReady: false,
    status: "prepared"
  };
}
