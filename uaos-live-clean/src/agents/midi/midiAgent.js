export const UAOS_MIDI_AGENT_VERSION = "46.0.0";

export function runMidiAgent(input = {}) {
  const sections = input.sections || [
    { id: "intro1", bars: 4, chord: "Cm" },
    { id: "mainA", bars: 8, chord: "Cm" },
    { id: "fill1", bars: 1, chord: "G7" },
    { id: "ending1", bars: 4, chord: "Cm" }
  ];

  return {
    agent: "MidiAgent",
    version: UAOS_MIDI_AGENT_VERSION,
    preparedFiles: ["midi-timeline.plan.json", "midi-channel-map.plan.json"],
    midiReference: {
      format: "UAOS_AGENT_MIDI_REFERENCE",
      tempo: input.tempo || 96,
      meter: input.meter || "4/4",
      sections,
      timeline: sections.map((section, index) => ({
        index,
        id: section.id,
        bars: section.bars,
        chord: section.chord
      }))
    },
    status: "prepared"
  };
}
