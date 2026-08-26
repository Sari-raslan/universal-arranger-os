/**
 * Singy Teen studio fundamentals — offline contract.
 * Not V13 Mixer. Not commercial PASS.
 */
import { createMusicalSessionMemory } from "../session/musicalSessionMemory.js";
import { SongArranger } from "../song-arranger.js";
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
  const song = new SongArranger().generate("Oriental Pop");
  const memory = createMusicalSessionMemory({ storage });
  memory.saveProject({
    ...started.project,
    tempo,
    arrangement: { sections: song.song.map((s) => ({ name: s.section, bars: s.bars, chord: s.chord })) }
  });
  const draft = exportMidiDraft({ song: { song: song.song }, state: { tempo } });
  const exportStep = runExerciseStep(exercise, "export", { draftOk: draft.ok });
  return {
    ok: tempoStep.ok && arrangeStep.ok && exportStep.ok && draft.ok,
    started,
    song: song.song,
    draft,
    steps: [tempoStep, arrangeStep, exportStep],
    musicalQualityClaim: false,
    capabilityId: "uaos.singy.teen-studio-fundamentals/v1"
  };
}

export { completeKidsLesson };
