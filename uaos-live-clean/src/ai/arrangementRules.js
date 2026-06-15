export const STYLE_RULES = Object.freeze({
  generic: { tempoRange: [70, 150], introBars: 4, endingBars: 4, fillEverySections: 1, drumDensity: 0.55, bassActivity: 0.55 },
  ballad: { tempoRange: [60, 95], introBars: 4, endingBars: 4, fillEverySections: 2, drumDensity: 0.35, bassActivity: 0.4 },
  dance: { tempoRange: [105, 132], introBars: 8, endingBars: 4, fillEverySections: 1, drumDensity: 0.82, bassActivity: 0.78 },
  oriental: { tempoRange: [80, 130], introBars: 4, endingBars: 4, fillEverySections: 1, drumDensity: 0.68, bassActivity: 0.52, percussion: "maqsum-original metadata" },
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

export function selectStyleRules(styleId = "generic") {
  return STYLE_RULES[styleId] || STYLE_RULES.generic;
}

export function generateArrangementRules({ styleId = "generic", sections = [], tempo = 120, manualOverride = {} } = {}) {
  const rules = selectStyleRules(styleId);
  const sectionCount = Math.max(1, sections.length || 4);
  return {
    schemaVersion: 1,
    styleId,
    tempo: clamp(tempo, rules.tempoRange[0], rules.tempoRange[1]),
    timeSignature: manualOverride.timeSignature || [4, 4],
    introLengthBars: manualOverride.introLengthBars ?? rules.introBars,
    endingLengthBars: manualOverride.endingLengthBars ?? rules.endingBars,
    fillLocations: Array.from({ length: sectionCount }, (_, index) => index)
      .filter((index) => index > 0 && index % rules.fillEverySections === 0),
    variationEscalation: sections.map((section, index) => ({
      sectionId: section.id || `section-${index + 1}`,
      intensity: clamp((section.confidence || 0.4) + index / Math.max(2, sectionCount) * 0.35, 0.1, 1),
    })),
    partActivity: {
      drums: clamp(rules.drumDensity, 0, 1),
      bass: clamp(rules.bassActivity, 0, 1),
      chord: 0.65,
      pad: 0.45,
      phrase: 0.35,
    },
    voiceLeading: { preferStepwiseMotion: true, maxLeap: 7 },
    avoidNotes: { status: "foundation", notes: [] },
    orientalPercussion: rules.percussion || null,
    deterministic: true,
    manualOverride,
  };
}
