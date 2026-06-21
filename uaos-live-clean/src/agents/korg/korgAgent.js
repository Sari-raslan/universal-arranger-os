export const UAOS_KORG_AGENT_VERSION = "46.0.0";

export function runKorgAgent(input = {}) {
  return {
    agent: "KorgAgent",
    version: UAOS_KORG_AGENT_VERSION,
    target: "korg",
    devices: ["PA3X Oriental", "PA5X"],
    preparedFiles: [
      "korg-section-map.plan.json",
      "korg-style-container.plan.json",
      "korg-compatibility.plan.json"
    ],
    plan: {
      futureFormats: [".STY", ".SET"],
      sectionMap: {
        intro: ["intro1", "intro2"],
        main: ["mainA", "mainB", "mainC", "mainD"],
        fill: ["fill1", "fill2"],
        ending: ["ending1", "ending2"]
      },
      channels: { drums: 10, bass: 2, chords: 3, pad: 4, lead: 5 },
      sourceProject: input.projectName || "UAOS Agent Prepared Project"
    },
    realBinaryReady: false,
    status: "prepared"
  };
}
