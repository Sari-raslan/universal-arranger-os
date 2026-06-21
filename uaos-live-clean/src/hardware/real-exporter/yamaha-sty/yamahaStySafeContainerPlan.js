import {
  buildYamahaStyPhraseEventSchema,
  validateYamahaStyPhraseEventSchema
} from "./yamahaStyPhraseEventBuilder.js";

export const UAOS_PHASE59_VERSION = "59.0.0";

export function createYamahaStySafeContainerPlan(input = {}) {
  const phraseSchema = buildYamahaStyPhraseEventSchema(input);
  const valid = validateYamahaStyPhraseEventSchema(phraseSchema);
  if (!valid.ok) throw new Error(valid.errors.join(", "));

  return {
    format: "UAOS_YAMAHA_STY_SAFE_CONTAINER_PLAN",
    version: UAOS_PHASE59_VERSION,
    phase: 59,
    target: "yamaha",
    futureFormat: ".STY",
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    allowedOutputsNow: [".json", ".uaosbin"],
    blockedOutputs: [".STY"],

    container: {
      containerName: `${phraseSchema.metadata.styleName}.safe-yamaha-sty-plan`,
      containerType: "SAFE_JSON_CONTAINER_PLAN",
      binaryContainerReady: false,
      chunks: [
        {
          id: "META",
          type: "metadata",
          readyForJson: true,
          readyForBinary: false,
          data: phraseSchema.metadata
        },
        {
          id: "SECTIONS",
          type: "section-map",
          readyForJson: true,
          readyForBinary: false,
          count: phraseSchema.sections.length
        },
        {
          id: "PHRASES",
          type: "phrase-events",
          readyForJson: true,
          readyForBinary: false,
          eventCount: phraseSchema.phraseEventSummary.eventCount
        },
        {
          id: "OTS",
          type: "ots-placeholder",
          readyForJson: true,
          readyForBinary: false,
          enabled: false
        },
        {
          id: "RULES",
          type: "casm-like-rules-placeholder",
          readyForJson: true,
          readyForBinary: false,
          researched: false
        }
      ]
    },

    payload: {
      phraseSchema
    },

    writerBlockers: [
      "real Yamaha STY chunk format not validated",
      "CASM-like rules not validated",
      "OTS metadata not validated",
      "checksum/package rules not validated",
      "roundtrip import not tested",
      "hardware/editor validation not completed"
    ],

    safety: {
      status: "SAFE_CONTAINER_PLAN_READY",
      realBinaryBlocked: true,
      warning: "Phase 59 creates a safe JSON container plan only. It does not create a Yamaha .STY binary file."
    }
  };
}

export function validateYamahaStySafeContainerPlan(plan) {
  const errors = [];

  if (plan?.format !== "UAOS_YAMAHA_STY_SAFE_CONTAINER_PLAN") errors.push("Invalid container plan format.");
  if (plan?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (plan?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (plan?.realStyWriterReady !== false) errors.push("Must not claim real STY writer ready.");
  if (plan?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (plan?.container?.binaryContainerReady !== false) errors.push("Binary container must not be ready.");
  if (!plan?.container?.chunks?.length) errors.push("Missing container chunks.");
  if (!plan?.container?.chunks?.every(chunk => chunk.readyForBinary === false)) errors.push("Every chunk must keep readyForBinary false.");
  if (!plan?.payload?.phraseSchema) errors.push("Missing phrase schema payload.");
  if (!plan?.writerBlockers?.length) errors.push("Missing writer blockers.");
  if (plan?.safety?.realBinaryBlocked !== true) errors.push("Safety realBinaryBlocked must be true.");

  return { ok: errors.length === 0, errors };
}
