import { analyzeAudioBuffer } from "./audioAnalysisCore.js";

export function analyzeSongStructure(input, options = {}) {
  const analysis = input?.schemaVersion ? input : analyzeAudioBuffer(input, options);
  if (!analysis.ok) return { ok: false, error: analysis.error, sections: [], confidence: 0 };
  const sections = analysis.sections.map((section, index) => ({
    ...section,
    repeatedSimilarity: index > 1 && section.label === analysis.sections[index - 2]?.label ? 0.65 : 0.25,
    manualOverride: false,
  }));
  return {
    schemaVersion: 1,
    ok: true,
    analysisId: options.analysisId || "local-analysis",
    duration: analysis.duration,
    tempo: analysis.tempo,
    key: analysis.key,
    mode: analysis.key.mode,
    chordTimeline: analysis.chordTimeline,
    energyTimeline: analysis.energyCurve,
    onsetTimeline: analysis.onsets,
    sections,
    globalConfidence: Math.min(0.82, analysis.globalConfidence),
    deterministicFallback: analysis.globalConfidence < 0.35,
    manualOverrideSupported: true,
  };
}
