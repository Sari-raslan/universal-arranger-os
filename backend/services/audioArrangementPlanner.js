const SECTION_TYPES = new Set([
  "intro",
  "verse",
  "pre-chorus",
  "chorus",
  "bridge",
  "solo",
  "break",
  "outro"
]);

function assertNumber(value, name, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new TypeError(`${name} must be between ${min} and ${max}`);
  }
}

function normalizeSection(section, index) {
  const type = String(section && section.type ? section.type : "")
    .trim()
    .toLowerCase();

  if (!SECTION_TYPES.has(type)) {
    throw new TypeError(`sections[${index}].type is unsupported`);
  }

  assertNumber(section.startBar, `sections[${index}].startBar`, 1, 100000);
  assertNumber(section.lengthBars, `sections[${index}].lengthBars`, 1, 4096);

  return {
    id: section.id || `section-${index + 1}`,
    type,
    startBar: Math.trunc(section.startBar),
    lengthBars: Math.trunc(section.lengthBars),
    energy: Number.isFinite(section.energy)
      ? Math.max(0, Math.min(1, section.energy))
      : 0.5
  };
}

function mapSectionToStyleElements(section) {
  if (section.type === "intro") return ["intro-1"];
  if (section.type === "outro") return ["ending-1"];
  if (section.type === "break") return ["break"];
  if (section.type === "solo") return ["variation-3", "fill-2"];
  if (section.type === "bridge") return ["variation-3"];

  if (section.type === "chorus") {
    return section.energy >= 0.75 ? ["variation-4"] : ["variation-3"];
  }

  if (section.type === "pre-chorus") {
    return ["variation-2", "fill-1"];
  }

  return section.energy >= 0.6 ? ["variation-2"] : ["variation-1"];
}

function createArrangementPlan(input) {
  const source = input || {};
  const title = String(source.title || "Untitled").trim() || "Untitled";

  assertNumber(source.bpm, "bpm", 20, 300);

  const timeSignature = source.timeSignature || {
    numerator: 4,
    denominator: 4
  };

  assertNumber(timeSignature.numerator, "timeSignature.numerator", 1, 32);

  if (![1, 2, 4, 8, 16, 32].includes(timeSignature.denominator)) {
    throw new TypeError("timeSignature.denominator is unsupported");
  }

  if (!Array.isArray(source.sections) || source.sections.length === 0) {
    throw new TypeError("sections must contain at least one section");
  }

  const sections = source.sections
    .map(normalizeSection)
    .sort((a, b) => a.startBar - b.startBar);

  for (let index = 1; index < sections.length; index += 1) {
    const previousEnd =
      sections[index - 1].startBar + sections[index - 1].lengthBars;

    if (sections[index].startBar < previousEnd) {
      throw new TypeError(`sections overlap at ${sections[index].id}`);
    }
  }

  return {
    schemaVersion: 1,
    title,
    bpm: source.bpm,
    key: String(source.key || "C"),
    scale: String(source.scale || "major"),
    timeSignature,
    source: {
      mode:
        source.sourceMode === "audio-analysis"
          ? "audio-analysis"
          : "manual-metadata",
      confidence: Number.isFinite(source.confidence)
        ? Math.max(0, Math.min(1, source.confidence))
        : null
    },
    targetProfiles: Array.isArray(source.targetProfiles)
      ? [...new Set(source.targetProfiles.map(String))]
      : [],
    timeline: sections.map((section) => ({
      ...section,
      arrangerElements: mapSectionToStyleElements(section)
    })),
    capabilities: {
      neutralArrangementManifest: true,
      midiDraftExport: false,
      proprietarySetExport: false,
      stemSeparation: false
    }
  };
}

function validateArrangementPlan(plan) {
  if (!plan || plan.schemaVersion !== 1) return false;
  if (!Array.isArray(plan.timeline) || plan.timeline.length === 0) return false;

  return plan.timeline.every(
    (section) =>
      SECTION_TYPES.has(section.type) &&
      Number.isInteger(section.startBar) &&
      Number.isInteger(section.lengthBars) &&
      Array.isArray(section.arrangerElements)
  );
}

module.exports = {
  createArrangementPlan,
  validateArrangementPlan,
  mapSectionToStyleElements
};
