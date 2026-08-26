/**
 * Singy Teen studio fundamentals — offline contract via Golden Brain.
 */
import { createMusicalSessionMemory } from "../session/musicalSessionMemory.js";
import { arrangerViaGoldenBrain } from "../goldenBrain/programConsumers.js";
import { GOLDEN_BRAIN_CONTRACT } from "../goldenBrain/goldenBrainCore.js";
import { exportMidiDraft } from "../midi-exporter.js";
import { completeKidsLesson, createExercise, runExerciseStep } from "./exerciseRunner.js";
import { startLessonSession } from "./offlineLesson.js";

export function teenStudioFundamentals({ storage, tempo = 100 } = {}) {
  const started = startLessonSession({ program: "teen", lessonId: "teen-arrange", storage });
  const exercise = createExercise("teen-arrange", "teen");
  const tempoStep = runExerciseStep(exercise, "set-tempo", { tempo });
  const arrangeStep = runExerciseStep(exercise, "arrange", {
    sections: ["Intro", "Verse", "Chorus"]
  });
  const via = arrangerViaGoldenBrain({ style: "Oriental Pop", tempo });
  const sections = via.arrangement?.sections || [];
  const songShape = sections.map((s) => ({ section: s.name, bars: s.bars, chord: s.chord }));
  const memory = createMusicalSessionMemory({ storage });
  memory.saveProject({
    ...started.project,
    tempo,
    arrangement: { sections }
  });
  const draft = exportMidiDraft({ song: { song: songShape }, state: { tempo } });
  const exportStep = runExerciseStep(exercise, "export", { draftOk: draft.ok });
  return {
    ok: tempoStep.ok && arrangeStep.ok && exportStep.ok && draft.ok && via.arrangement?.ok === true,
    started,
    song: songShape,
    goldenBrainCapabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    draft,
    steps: [tempoStep, arrangeStep, exportStep],
    musicalQualityClaim: false,
    capabilityId: "uaos.singy.teen-studio-fundamentals/v1"
  };
}

export { completeKidsLesson };
