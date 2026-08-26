/**
 * Singy Kids / Teen offline lesson session (tracked backend).
 * Recovers musical session memory. Not a V13 Mixer path.
 */
import { createMusicalSessionMemory } from "../session/musicalSessionMemory.js";

export function createOfflineLessonCatalog(program = "kids") {
  const lessons =
    program === "teen"
      ? [
          { id: "teen-tempo", title: "Tempo control", minutes: 8 },
          { id: "teen-arrange", title: "Section arrange", minutes: 12 },
          { id: "teen-export", title: "MIDI draft export", minutes: 10 }
        ]
      : [
          { id: "kids-pulse", title: "Feel the pulse", minutes: 5 },
          { id: "kids-melody", title: "Sing a short melody", minutes: 6 },
          { id: "kids-listen", title: "Listen and copy", minutes: 5 }
        ];
  return { ok: true, program, offline: true, lessons, musicalQualityClaim: false };
}

export function startLessonSession({ program = "kids", lessonId, storage } = {}) {
  const catalog = createOfflineLessonCatalog(program);
  const lesson = catalog.lessons.find((l) => l.id === lessonId) || catalog.lessons[0];
  const memory = createMusicalSessionMemory({ storage });
  const project = memory.saveProject({
    projectId: `singy-${program}-${lesson.id}`,
    title: lesson.title,
    tempo: program === "teen" ? 100 : 90,
    keyCenter: "C",
    arrangement: { sections: [{ name: "Lesson", bars: 4 }] }
  });
  const session = memory.saveSession({
    schema: "uaos.musical-session-memory/v1",
    program,
    lessonId: lesson.id,
    progress: 0,
    offline: true
  });
  return { ok: true, catalog, lesson, project, session, capabilityId: "uaos.singy.offline-lesson/v1" };
}

export function advanceLesson(memory, progress) {
  const current = memory.loadSession();
  const next = memory.saveSession({
    ...current,
    progress: Math.max(0, Math.min(100, Number(progress) || 0)),
    updatedAt: new Date().toISOString()
  });
  return { ok: true, session: next };
}
