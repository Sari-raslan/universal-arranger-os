import { createSingerMidiLearningExport } from "./singerLearningMidiExport.js";
import { createSingerLearningReport } from "./singerMelodyLearningCore.js";
export function createSingerLearningExportPackage(notes = [], instrument = "piano") {
  const learning = createSingerLearningReport(notes, instrument);
  const midi = createSingerMidiLearningExport(learning.learningNotes, { tempo: 120 });
  return {
    gate: "SINGER-REAL-PRODUCT-GATE-06-LEARNING-EXPORT-PACKAGE",
    sale: "LOCKED",
    payment: "NOT_ACTIVE",
    instrument: learning.instrument,
    noteCount: learning.noteCount,
    midiBytes: midi.byteLength,
    hasMidiHeader: midi.hasMidiHeader,
    hasTrackHeader: midi.hasTrackHeader,
    pdf: "LOCKED_NEXT_GATE",
    video: "LOCKED_NEXT_GATE",
    mobile: "LOCKED_NEXT_GATE",
    commercialReady: false,
  };
}
