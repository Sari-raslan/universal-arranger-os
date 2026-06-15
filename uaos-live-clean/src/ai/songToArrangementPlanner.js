import { DEFAULT_ARRANGER_PART_ASSIGNMENTS } from "../arranger/arrangerAudioIntegration.js";
import { generateArrangementRules } from "./arrangementRules.js";

export function createSongArrangementPlan(structure, {
  sourceAnalysisId = "local-analysis",
  styleId = "generic",
  seed = "uaos-phase5-local",
  samplerPresetRefs = {},
} = {}) {
  const rules = generateArrangementRules({
    styleId,
    sections: structure.sections || [],
    tempo: structure.tempo?.bpm || 120,
  });
  const sections = structure.sections?.length ? structure.sections : [
    { id: "section-1", label: "intro", start: 0, end: 8, confidence: 0.2 },
    { id: "section-2", label: "verse", start: 8, end: 32, confidence: 0.2 },
    { id: "section-3", label: "ending", start: 32, end: 40, confidence: 0.2 },
  ];
  return {
    schemaVersion: 1,
    sourceAnalysisId,
    seed,
    tempo: structure.tempo?.bpm || 120,
    timeSignature: rules.timeSignature,
    key: structure.key?.key || "Unknown",
    mode: structure.mode || structure.key?.mode || "unknown",
    maqam: structure.maqam || null,
    chordProgression: structure.chordTimeline || [],
    intro: { bars: rules.introLengthBars, sectionId: sections[0].id },
    variations: sections.map((section, index) => ({
      sectionId: section.id,
      arrangerSection: index === 0 ? "intro1" : index === sections.length - 1 ? "ending1" : `variation${Math.min(4, index)}`,
      intensity: rules.variationEscalation[index]?.intensity || 0.4,
    })),
    fills: rules.fillLocations.map((index) => ({ afterSectionId: sections[index]?.id || sections.at(-1).id, type: "fill1" })),
    breakSuggestion: sections.length > 3 ? { beforeSectionId: sections.at(-2).id, type: "break" } : null,
    ending: { bars: rules.endingLengthBars, sectionId: sections.at(-1).id },
    partActivity: rules.partActivity,
    instrumentRoles: Object.fromEntries(Object.entries(DEFAULT_ARRANGER_PART_ASSIGNMENTS).map(([lane, assignment]) => [
      lane,
      { ...assignment, presetId: samplerPresetRefs[lane] || assignment.presetId },
    ])),
    confidence: Math.min(0.82, structure.globalConfidence || 0.3),
    manualEditable: ["tempo", "key", "sections", "fills", "partActivity", "instrumentRoles"],
    warnings: structure.deterministicFallback ? ["Low-confidence analysis; deterministic fallback plan used."] : [],
    unsupportedCases: ["No proprietary style-file conversion", "No cloud API call", "No payment or upload"],
  };
}
