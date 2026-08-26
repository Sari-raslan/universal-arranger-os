import test from "node:test";
import assert from "node:assert/strict";
import { createOfflineLessonCatalog, startLessonSession, advanceLesson } from "../backend/src/singy/offlineLesson.js";
import { createMemoryStorage } from "../backend/src/session/memoryStorage.js";
import { createMusicalSessionMemory } from "../backend/src/session/musicalSessionMemory.js";

test("Singy Kids and Teen offline lesson catalogs are distinct", () => {
  const kids = createOfflineLessonCatalog("kids");
  const teen = createOfflineLessonCatalog("teen");
  assert.equal(kids.offline, true);
  assert.notEqual(kids.lessons[0].id, teen.lessons[0].id);
});

test("Singy lesson session persists offline without claiming musical quality", () => {
  const storage = createMemoryStorage();
  const started = startLessonSession({ program: "teen", lessonId: "teen-arrange", storage });
  assert.equal(started.ok, true);
  assert.equal(started.project.tempo, 100);
  const memory = createMusicalSessionMemory({ storage });
  const advanced = advanceLesson(memory, 40);
  assert.equal(advanced.session.progress, 40);
  assert.equal(memory.snapshot().musicalQualityClaim, false);
});
