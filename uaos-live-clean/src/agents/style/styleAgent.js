export const UAOS_STYLE_AGENT_VERSION = "46.0.0";

export function runStyleAgent(input = {}) {
  return {
    agent: "StyleAgent",
    version: UAOS_STYLE_AGENT_VERSION,
    preparedFiles: ["style-sections.plan.json", "arrangement-map.plan.json"],
    stylePlan: {
      format: "UAOS_AGENT_STYLE_PLAN",
      projectName: input.projectName || "UAOS Agent Prepared Project",
      key: input.key || "C minor",
      chordProgression: input.chordProgression || ["Cm", "Ab", "Fm", "G7"],
      sections: input.sections || [
        { id: "intro1", type: "intro", bars: 4, chord: "Cm" },
        { id: "mainA", type: "main", bars: 8, chord: "Cm" },
        { id: "fill1", type: "fill", bars: 1, chord: "G7" },
        { id: "mainB", type: "main", bars: 8, chord: "Fm" },
        { id: "ending1", type: "ending", bars: 4, chord: "Cm" }
      ]
    },
    status: "prepared"
  };
}
