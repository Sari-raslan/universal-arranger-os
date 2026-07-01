const FORBIDDEN_PATTERNS = [
  { id: "keyboard-output", pattern: /keyboard\s+output/i },
  { id: "keyboard-transfer", pattern: /keyboard\s+transfer/i },
  { id: "real-keyboard-writer", pattern: /real\s+keyboard\s+writer/i },
  { id: "restricted-style-format", pattern: /\.(STY|SET|PRS|STL|PAT|MSP|KST)\b/i },
  { id: "kontakt-copying", pattern: /Kontakt\s+copying/i },
  { id: "native-instruments-copying", pattern: /Native\s+Instruments\s+copying/i },
  { id: "commercial-sample-copying", pattern: /commercial\s+sample\s+copying/i },
  { id: "stripe", pattern: /Stripe/i },
  { id: "paypal", pattern: /PayPal/i },
  { id: "checkout", pattern: /checkout/i },
  { id: "payment-functionality", pattern: /payment\s+functionality/i }
];

const REQUIRED_SECTION_NAMES = ["intro", "verse", "chorus", "ending"];
const OPTIONAL_SECTION_NAMES = ["bridge", "fill", "prechorus", "outro"];
const ALLOWED_SECTION_NAMES = new Set([...REQUIRED_SECTION_NAMES, ...OPTIONAL_SECTION_NAMES]);
const ALLOWED_OUTPUT_MODES = new Set(["midi-only", "spec-only", "json-only", "metadata-only"]);

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

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function validateArrangerPlan(plan) {
  const errors = [];
  const warnings = [];

  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return {
      status: "FAIL",
      errors: [{ code: "plan-not-object", message: "Plan must be a JSON object." }],
      warnings
    };
  }

  const text = collectText(plan);
  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (forbidden.pattern.test(text)) {
      errors.push({
        code: `forbidden-claim:${forbidden.id}`,
        message: `Forbidden claim or term detected: ${forbidden.id}`
      });
    }
  }

  if (!plan.project || typeof plan.project !== "object") {
    errors.push({ code: "missing-project-metadata", message: "Plan must include project metadata." });
  } else {
    if (!hasValue(plan.project.name)) {
      errors.push({ code: "missing-project-name", message: "Project metadata must include name." });
    }
    if (!hasValue(plan.project.title)) {
      errors.push({ code: "missing-project-title", message: "Project metadata must include title." });
    }
  }

  if (!hasValue(plan.title)) {
    errors.push({ code: "missing-plan-title", message: "Plan must include a top-level title." });
  }

  if (plan.outputMode && !ALLOWED_OUTPUT_MODES.has(String(plan.outputMode).toLowerCase())) {
    errors.push({
      code: "invalid-output-mode",
      message: `Output mode must be one of: ${Array.from(ALLOWED_OUTPUT_MODES).join(", ")}.`
    });
  }

  if (plan.maqam && typeof plan.maqam !== "object") {
    errors.push({ code: "invalid-maqam-metadata", message: "Maqam metadata must be an object when present." });
  }

  if (plan.quarterToneMetadata && typeof plan.quarterToneMetadata !== "object") {
    errors.push({ code: "invalid-quarter-tone-metadata", message: "Quarter-tone metadata must be an object when present." });
  }

  if (!Array.isArray(plan.sections)) {
    errors.push({ code: "missing-sections-array", message: "Plan must include a sections array." });
  } else {
    const sectionNames = plan.sections.map((section) => normalizeName(section.name));
    for (const required of REQUIRED_SECTION_NAMES) {
      if (!sectionNames.includes(required)) {
        errors.push({
          code: `missing-required-section:${required}`,
          message: `Plan must include required section: ${required}.`
        });
      }
    }

    plan.sections.forEach((section, index) => {
      const label = section && section.name ? section.name : `section-${index}`;
      if (!section || typeof section !== "object" || Array.isArray(section)) {
        errors.push({ code: `invalid-section:${index}`, message: `Section ${index} must be an object.` });
        return;
      }

      const sectionName = normalizeName(section.name);
      if (!sectionName) {
        errors.push({ code: `missing-section-name:${index}`, message: `Section ${index} must include name.` });
      } else if (!ALLOWED_SECTION_NAMES.has(sectionName)) {
        warnings.push({
          code: `unknown-section-name:${sectionName}`,
          message: `Section ${label} is not required or listed as optional.`
        });
      }

      if (!Number.isFinite(section.bars) || section.bars <= 0) {
        errors.push({ code: `invalid-bars:${sectionName || index}`, message: `Section ${label} must include positive numeric bars.` });
      }

      if (!hasValue(section.chords) && !hasValue(section.harmonicPlan)) {
        errors.push({
          code: `missing-harmony:${sectionName || index}`,
          message: `Section ${label} must include chords or harmonicPlan.`
        });
      }

      if (!Array.isArray(section.instruments) || section.instruments.length === 0) {
        errors.push({
          code: `missing-instruments:${sectionName || index}`,
          message: `Section ${label} must include instruments array.`
        });
      }

      if (!hasValue(section.role)) {
        errors.push({
          code: `missing-role:${sectionName || index}`,
          message: `Section ${label} must include role.`
        });
      }
    });
  }

  return {
    status: errors.length === 0 ? "PASS" : "FAIL",
    errors,
    warnings
  };
}

export {
  ALLOWED_OUTPUT_MODES,
  ALLOWED_SECTION_NAMES,
  FORBIDDEN_PATTERNS,
  REQUIRED_SECTION_NAMES,
  validateArrangerPlan
};
