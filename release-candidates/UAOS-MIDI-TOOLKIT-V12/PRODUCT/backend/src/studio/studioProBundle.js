/**
 * Studio Pro local project bundle (offline).
 * Packages session memory + optional MIDI draft bytes metadata.
 */
import crypto from "node:crypto";
import { createMusicalSessionMemory } from "../session/musicalSessionMemory.js";
import { exportGoldenSequencerMidi } from "../export/goldenSequencerMidi.js";

export function buildStudioProBundle({ title = "Studio Pro Draft", tempo = 100, storage } = {}) {
  const memory = createMusicalSessionMemory({ storage });
  const project = memory.saveProject({
    projectId: `studio-pro-${Date.now()}`,
    title,
    tempo,
    keyCenter: "C",
    arrangement: {
      sections: [
        { name: "Intro", bars: 4 },
        { name: "Main A", bars: 8 },
        { name: "Ending", bars: 4 }
      ]
    }
  });
  const midi = exportGoldenSequencerMidi({ tempo, bars: 2 });
  const bundle = {
    schema: "uaos.studio-pro.bundle/v1",
    project,
    midiDraft: {
      ok: midi.ok,
      noteCount: midi.noteEvents.length,
      bytesSha256: crypto.createHash("sha256").update(midi.bytes).digest("hex"),
      hardwareVerified: false
    },
    commercialReady: false,
    musicalQualityPass: false
  };
  const sha256 = crypto.createHash("sha256").update(JSON.stringify(bundle)).digest("hex");
  return { ok: midi.ok, bundle, sha256 };
}
