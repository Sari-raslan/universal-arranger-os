export const ARRANGER_SECTIONS = Object.freeze([
  "intro1",
  "intro2",
  "variation1",
  "variation2",
  "variation3",
  "variation4",
  "fill1",
  "fill2",
  "break",
  "ending1",
  "ending2",
]);

export const ARRANGER_LANES = Object.freeze([
  "drums",
  "percussion",
  "bass",
  "chord1",
  "chord2",
  "pad",
  "phrase1",
  "phrase2",
]);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

function createLane(name, events = []) {
  return {
    name,
    muted: false,
    volume: 0.85,
    pan: 0,
    events: events.map((event) => ({
      beat: clamp(event.beat ?? 0, 0, 64),
      duration: clamp(event.duration ?? 0.25, 0.01, 16),
      note: clamp(event.note ?? 60, 0, 127),
      velocity: clamp(event.velocity ?? 100, 1, 127),
      role: String(event.role || "chord-tone"),
    })),
  };
}

export function createDefaultOpenStyle() {
  const sections = {};

  for (const section of ARRANGER_SECTIONS) {
    sections[section] = {
      id: section,
      bars: section.startsWith("fill") || section === "break" ? 1 : 4,
      lanes: ARRANGER_LANES.map((lane) => createLane(lane)),
    };
  }

  sections.variation1.lanes = [
    createLane("drums", [
      { beat: 0, note: 36, velocity: 110, role: "kick" },
      { beat: 1, note: 38, velocity: 96, role: "snare" },
      { beat: 2, note: 36, velocity: 108, role: "kick" },
      { beat: 3, note: 38, velocity: 100, role: "snare" },
    ]),
    createLane("percussion", [
      { beat: 0, note: 42, velocity: 74, role: "hat" },
      { beat: 0.5, note: 42, velocity: 68, role: "hat" },
      { beat: 1, note: 42, velocity: 74, role: "hat" },
      { beat: 1.5, note: 42, velocity: 68, role: "hat" },
      { beat: 2, note: 42, velocity: 74, role: "hat" },
      { beat: 2.5, note: 42, velocity: 68, role: "hat" },
      { beat: 3, note: 42, velocity: 74, role: "hat" },
      { beat: 3.5, note: 42, velocity: 68, role: "hat" },
    ]),
    createLane("bass", [
      { beat: 0, note: 36, velocity: 100, role: "root" },
      { beat: 2, note: 43, velocity: 88, role: "fifth" },
    ]),
    createLane("chord1", [
      { beat: 0, note: 60, velocity: 82, duration: 1.5, role: "triad" },
      { beat: 2, note: 60, velocity: 78, duration: 1.5, role: "triad" },
    ]),
    createLane("chord2"),
    createLane("pad"),
    createLane("phrase1"),
    createLane("phrase2"),
  ];

  return {
    schemaVersion: 1,
    name: "UAOS Open Style",
    tempo: 100,
    timeSignature: {
      numerator: 4,
      denominator: 4,
    },
    currentSection: "variation1",
    pendingSection: null,
    sections,
  };
}

export function validateOpenStyle(style) {
  const errors = [];

  if (!style || typeof style !== "object") {
    return {
      valid: false,
      errors: ["Style must be an object."],
    };
  }

  if (style.schemaVersion !== 1) {
    errors.push("schemaVersion must be 1.");
  }

  if (!style.sections || typeof style.sections !== "object") {
    errors.push("sections object is required.");
  }

  if (
    style.currentSection &&
    !ARRANGER_SECTIONS.includes(style.currentSection)
  ) {
    errors.push("currentSection is invalid.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function normalizeOpenStyle(style) {
  const fallback = createDefaultOpenStyle();
  const source = style && typeof style === "object" ? style : {};
  const sections = {};

  for (const sectionName of ARRANGER_SECTIONS) {
    const sourceSection = source.sections?.[sectionName];
    const fallbackSection = fallback.sections[sectionName];

    sections[sectionName] = {
      id: sectionName,
      bars: clamp(
        sourceSection?.bars ?? fallbackSection.bars,
        1,
        32,
      ),
      lanes: ARRANGER_LANES.map((laneName) => {
        const sourceLane = sourceSection?.lanes?.find(
          (lane) => lane.name === laneName,
        );
        const fallbackLane = fallbackSection.lanes.find(
          (lane) => lane.name === laneName,
        );

        return {
          ...createLane(
            laneName,
            sourceLane?.events ?? fallbackLane?.events ?? [],
          ),
          muted: Boolean(sourceLane?.muted ?? fallbackLane?.muted),
          volume: clamp(
            sourceLane?.volume ?? fallbackLane?.volume ?? 0.85,
            0,
            1,
          ),
          pan: clamp(
            sourceLane?.pan ?? fallbackLane?.pan ?? 0,
            -1,
            1,
          ),
        };
      }),
    };
  }

  return {
    schemaVersion: 1,
    name: String(source.name || fallback.name),
    tempo: clamp(source.tempo ?? fallback.tempo, 30, 300),
    timeSignature: {
      numerator: clamp(
        source.timeSignature?.numerator ??
          fallback.timeSignature.numerator,
        1,
        16,
      ),
      denominator: [2, 4, 8, 16].includes(
        Number(source.timeSignature?.denominator),
      )
        ? Number(source.timeSignature.denominator)
        : fallback.timeSignature.denominator,
    },
    currentSection: ARRANGER_SECTIONS.includes(source.currentSection)
      ? source.currentSection
      : fallback.currentSection,
    pendingSection: ARRANGER_SECTIONS.includes(source.pendingSection)
      ? source.pendingSection
      : null,
    sections,
  };
}

export function requestSection(style, sectionName) {
  const normalized = normalizeOpenStyle(style);

  if (!ARRANGER_SECTIONS.includes(sectionName)) {
    throw new RangeError(`Unknown arranger section: ${sectionName}`);
  }

  return {
    ...normalized,
    pendingSection: sectionName,
  };
}

export function commitPendingSection(style) {
  const normalized = normalizeOpenStyle(style);

  if (!normalized.pendingSection) {
    return normalized;
  }

  return {
    ...normalized,
    currentSection: normalized.pendingSection,
    pendingSection: null,
  };
}

export function sectionDurationMs(style, sectionName) {
  const normalized = normalizeOpenStyle(style);
  const section = normalized.sections[sectionName];

  if (!section) {
    throw new RangeError(`Unknown arranger section: ${sectionName}`);
  }

  const beatsPerBar = normalized.timeSignature.numerator;
  const millisecondsPerBeat = 60000 / normalized.tempo;

  return section.bars * beatsPerBar * millisecondsPerBeat;
}

export function buildAccompanimentSnapshot(style, chord) {
  const normalized = normalizeOpenStyle(style);
  const section = normalized.sections[normalized.currentSection];

  return {
    section: normalized.currentSection,
    tempo: normalized.tempo,
    chord: chord?.name || "No chord",
    root: chord?.root ?? null,
    lanes: section.lanes.map((lane) => ({
      name: lane.name,
      muted: lane.muted,
      volume: lane.volume,
      pan: lane.pan,
      eventCount: lane.events.length,
    })),
  };
}

export function parseOpenStyle(text) {
  const parsed = JSON.parse(text);
  const validation = validateOpenStyle(parsed);

  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }

  return normalizeOpenStyle(parsed);
}