/**
 * Singy commercial family SKU — Kids + Teen under one launcher (P2).
 */
import { completeKidsLesson, recordedSingyA11yMatrix } from "../singy/exerciseRunner.js";
import { teenStudioFundamentals } from "../singy/teenStudio.js";
import { createMemoryStorage } from "../session/memoryStorage.js";
import { analyzeArrangementIntelligence } from "../arranger/arrangementIntelligence.js";

export const SKU_ID = "singy";
export const SKU_VERSION = "v10-rc1";

export function getSingyLauncher() {
  return {
    sku: SKU_ID,
    version: SKU_VERSION,
    modes: ["KIDS", "TEEN"],
    shared: [
      "Musical Brain (technical)",
      "session memory",
      "lesson engine",
      "built-in synthesized starter (no uncleared samples)",
      "MIDI/arrangement connection"
    ],
    differentiation: "LOCAL MUSICAL COACH + CREATION + MEMORY + KIDS/TEEN PERSONALITY + ME context where proven",
    unclearedExcluded: ["KORG", "MP3", "OUD/QANUN/NEY sample candidates"],
    publicRelease: false
  };
}

export function runSingyMode(mode, opts = {}) {
  const storage = createMemoryStorage();
  if (mode === "KIDS") {
    const lesson = completeKidsLesson({ storage, lessonId: opts.lessonId || "kids-melody" });
    const a11y = recordedSingyA11yMatrix();
    return {
      mode,
      ok: lesson.ok && lesson.session.progress === 100,
      lesson,
      a11y,
      offline: true,
      builtInOnly: true
    };
  }
  if (mode === "TEEN") {
    const studio = teenStudioFundamentals({ storage, tempo: opts.tempo || 104 });
    return {
      mode,
      ok: studio.ok,
      studio,
      offline: true,
      builtInOnly: true
    };
  }
  return { ok: false, errorCode: "MODE_NOT_FOUND", mode };
}

export function getSingyBrainStatus() {
  const intel = analyzeArrangementIntelligence({});
  return {
    sharedMusicalIntelligence: true,
    technicalPass: intel.ok,
    musicalAcceptanceDeferred: true,
    ownerMusicalQualityPass: false
  };
}
