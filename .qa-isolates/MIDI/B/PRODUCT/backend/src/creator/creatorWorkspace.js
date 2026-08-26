/**
 * Creator project workspace — offline technical contract via Golden Brain.
 */
import crypto from "node:crypto";
import { createMusicalSessionMemory } from "../session/musicalSessionMemory.js";
import { exportGoldenSequencerMidi } from "../export/goldenSequencerMidi.js";
import { creatorViaGoldenBrain } from "../goldenBrain/programConsumers.js";
import { GOLDEN_BRAIN_CONTRACT } from "../goldenBrain/goldenBrainCore.js";

export function createCreatorWorkspace({ title = "Creator Project", tempo = 100, storage } = {}) {
  const memory = createMusicalSessionMemory({ storage });
  const via = creatorViaGoldenBrain({ tempo, tasteProfile: { genres: "arabic khaleeji" } });
  const sections = via.arrangement?.sections || [];
  const project = memory.saveProject({
    projectId: `creator-${Date.now()}`,
    title,
    tempo,
    keyCenter: "C",
    arrangement: { sections: sections.map((s) => ({ name: s.name || s.section, bars: s.bars, chord: s.chord })) }
  });
  const midi = exportGoldenSequencerMidi({ tempo, bars: 2 });
  const workspace = {
    schema: "uaos.creator.workspace/v1",
    project,
    goldenBrainCapabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    tracks: [
      { id: "drums", kind: "sequencer" },
      { id: "bass", kind: "harmony" },
      { id: "chords", kind: "harmony" },
      { id: "export", kind: "midi-smf" }
    ],
    midi: {
      ok: midi.ok,
      noteCount: midi.noteEvents.length,
      bytesSha256: crypto.createHash("sha256").update(midi.bytes).digest("hex")
    },
    commercialReady: false,
    musicalQualityPass: false
  };
  return {
    ok: midi.ok && via.arrangement?.ok === true,
    workspace,
    sha256: crypto.createHash("sha256").update(JSON.stringify(workspace)).digest("hex"),
    capabilityId: "uaos.creator.workspace/v1"
  };
}
