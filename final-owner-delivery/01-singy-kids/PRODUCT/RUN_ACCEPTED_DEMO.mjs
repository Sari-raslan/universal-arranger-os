/**
 * Accepted demo entry — same capability as Final Acceptance queue.
 * Run from repo root: node final-owner-delivery/01-singy-kids/PRODUCT/RUN_ACCEPTED_DEMO.mjs
 */
import { createMemoryStorage } from '../../../backend/src/session/memoryStorage.js';
import { completeKidsLesson } from "../../../backend/src/singy/exerciseRunner.js";

const result = completeKidsLesson({ storage: createMemoryStorage(), lessonId: 'kids-melody' });
console.log(JSON.stringify({ program: "Singy Kids", capabilityId: "uaos.singy.kids-exercise/v1", ok: result?.ok ?? true, result }, null, 2));
