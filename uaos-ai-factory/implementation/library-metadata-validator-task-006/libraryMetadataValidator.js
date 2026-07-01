const ALLOWED_TIERS = new Set(["standard", "premium", "future_pro"]);
const ALLOWED_SOURCE_POLICIES = new Set([
  "original_recording_planned",
  "synthesis_metadata_only",
  "midi_spec_only"
]);
const ORIENTAL_STRINGS_REQUIRED_ARTICULATIONS = [
  "legato",
  "portamento",
  "slides",
  "trills",
  "tremolo",
  "marcato",
  "emotional_sustain"
];
const FORBIDDEN_PATTERNS = [
  { id: "proprietary-source", pattern: /proprietary\s+sample\s+source/i },
  { id: "commercial-sample-source", pattern: /commercial\s+sample\s+source/i },
  { id: "kontakt-copying", pattern: /Kontakt\s+copying/i },
  { id: "native-instruments-copying", pattern: /Native\s+Instruments\s+copying/i },
  { id: "commercial-sample-copying", pattern: /commercial\s+sample\s+copying/i },
  { id: "keyboard-output", pattern: /keyboard\s+output/i },
  { id: "keyboard-transfer", pattern: /keyboard\s+transfer/i },
  { id: "real-keyboard-writer", pattern: /real\s+keyboard\s+writer/i },
  { id: "restricted-style-format", pattern: /\.(STY|SET|PRS|STL|PAT|MSP|KST)\b/i },
  { id: "stripe", pattern: /Stripe/i },
  { id: "paypal", pattern: /PayPal/i },
  { id: "checkout", pattern: /checkout/i },
  { id: "payment-functionality", pattern: /payment\s+functionality/i }
];

function collectText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(collectText).join("\n");
  if (value && typeof value === "object") return Object.values(value).map(collectText).join("\n");
  return "";
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null && value !== "";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeArticulation(value) {
  return normalize(value).replace(/[\s-]+/g, "_");
}

function validateLibraryMetadata(library) {
  const errors = [];
  const warnings = [];

  if (!library || typeof library !== "object" || Array.isArray(library)) {
    return {
      status: "FAIL",
      errors: [{ code: "library-not-object", message: "Library metadata must be a JSON object." }],
      warnings
    };
  }

  const text = collectText(library);
  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (forbidden.pattern.test(text)) {
      errors.push({
        code: `forbidden-claim:${forbidden.id}`,
        message: `Forbidden claim or term detected: ${forbidden.id}`
      });
    }
  }

  for (const key of ["id", "name", "type", "tier", "version"]) {
    if (!hasValue(library[key])) {
      errors.push({
        code: `missing-library-${key}`,
        message: `Library must include ${key}.`
      });
    }
  }

  if (hasValue(library.tier) && !ALLOWED_TIERS.has(normalize(library.tier))) {
    errors.push({
      code: "invalid-tier",
      message: `Tier must be one of: ${Array.from(ALLOWED_TIERS).join(", ")}.`
    });
  }

  if (!hasValue(library.sourcePolicy)) {
    errors.push({
      code: "missing-source-policy",
      message: "Library must include sourcePolicy."
    });
  } else if (!ALLOWED_SOURCE_POLICIES.has(normalize(library.sourcePolicy))) {
    errors.push({
      code: "invalid-source-policy",
      message: `sourcePolicy must be one of: ${Array.from(ALLOWED_SOURCE_POLICIES).join(", ")}.`
    });
  }

  const isInstrumentLibrary = ["instrument", "instrument_library", "oriental_strings"].includes(normalize(library.type));
  if (isInstrumentLibrary && (!Array.isArray(library.articulations) || library.articulations.length === 0)) {
    errors.push({
      code: "missing-articulations",
      message: "Instrument libraries must include articulations array."
    });
  }

  const isOrientalStrings = normalize(library.type) === "oriental_strings" || normalize(library.category) === "oriental_strings";
  if (isOrientalStrings) {
    const articulations = Array.isArray(library.articulations)
      ? library.articulations.map(normalizeArticulation)
      : [];

    for (const required of ORIENTAL_STRINGS_REQUIRED_ARTICULATIONS) {
      if (!articulations.includes(required)) {
        errors.push({
          code: `missing-oriental-strings-articulation:${required}`,
          message: `Oriental Strings library must include articulation: ${required}.`
        });
      }
    }
  }

  if (library.maqam && typeof library.maqam !== "object") {
    errors.push({
      code: "invalid-maqam-metadata",
      message: "Maqam metadata must be an object when present."
    });
  }

  if (library.quarterToneMetadata && typeof library.quarterToneMetadata !== "object") {
    errors.push({
      code: "invalid-quarter-tone-metadata",
      message: "Quarter-tone metadata must be an object when present."
    });
  }

  if (library.containsAudio === true) {
    warnings.push({
      code: "contains-audio-review-required",
      message: "Audio content requires separate rights and QA review."
    });
  }

  return {
    status: errors.length === 0 ? "PASS" : "FAIL",
    errors,
    warnings
  };
}

export {
  ALLOWED_SOURCE_POLICIES,
  ALLOWED_TIERS,
  FORBIDDEN_PATTERNS,
  ORIENTAL_STRINGS_REQUIRED_ARTICULATIONS,
  validateLibraryMetadata
};
