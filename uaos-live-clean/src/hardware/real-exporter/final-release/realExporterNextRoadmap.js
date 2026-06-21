export const UAOS_PHASE73_VERSION = "73.0.0";

export function createRealExporterNextRoadmap() {
  return {
    format: "UAOS_REAL_EXPORTER_NEXT_ROADMAP",
    version: UAOS_PHASE73_VERSION,
    phase: 73,
    currentStatus: "SAFE_FOUNDATION_FINAL_READY",
    realKeyboardBinaryWriteAllowed: false,
    nextMajorWork: "Real Keyboard Binary Writer Validation Program",
    roadmap: [
      {
        phase: "R1",
        name: "Collect legal-safe user-owned fixtures",
        output: "fixture inventory and checksums",
        risk: "medium",
        required: true
      },
      {
        phase: "R2",
        name: "Build binary analyzer per device",
        output: "read-only binary structure report",
        risk: "high",
        required: true
      },
      {
        phase: "R3",
        name: "Roundtrip import validation",
        output: "same-file semantic validation report",
        risk: "high",
        required: true
      },
      {
        phase: "R4",
        name: "Checksum/package rule validation",
        output: "writer safety constraints",
        risk: "high",
        required: true
      },
      {
        phase: "R5",
        name: "First limited real writer",
        output: "one-device experimental writer behind hard gate",
        risk: "very-high",
        required: true
      }
    ],
    recommendedFirstRealTarget: {
      target: "yamaha",
      futureFormat: ".STY",
      reason: "The Yamaha safe track is the most complete in the current foundation."
    },
    blockedUntilRoadmapComplete: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
    finalDecision: {
      roadmapReady: true,
      safeFoundationClosed: true,
      realBinaryOutputAllowed: false
    },
    safety: {
      realBinaryBlocked: true,
      warning: "Roadmap only. It does not enable real binary output."
    }
  };
}

export function validateRealExporterNextRoadmap(roadmap) {
  const errors = [];

  if (roadmap?.format !== "UAOS_REAL_EXPORTER_NEXT_ROADMAP") errors.push("Invalid roadmap format.");
  if (roadmap?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real binary writing must be blocked.");
  if (!roadmap?.roadmap || roadmap.roadmap.length < 5) errors.push("Expected at least 5 roadmap steps.");
  if (roadmap?.finalDecision?.realBinaryOutputAllowed !== false) errors.push("Real binary output must be blocked.");
  if (roadmap?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");
  if (!roadmap?.recommendedFirstRealTarget?.target) errors.push("Missing recommended target.");

  return { ok: errors.length === 0, errors };
}
