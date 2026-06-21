import {
  listFormatResearchFixtures,
  validateFormatResearchFixture
} from "../fixtures/formatResearchFixtures.js";

export const UAOS_PHASE53_VERSION = "53.0.0";

export function analyzeFormatResearchFixture(fixture) {
  const valid = validateFormatResearchFixture(fixture);
  if (!valid.ok) {
    throw new Error(`${fixture?.target || "unknown"} invalid fixture: ${valid.errors.join(", ")}`);
  }

  return {
    format: "UAOS_FORMAT_ANALYSIS_REPORT",
    version: UAOS_PHASE53_VERSION,
    target: fixture.target,
    futureFormats: fixture.futureFormats,
    fixtureFile: fixture.fixtureFile,
    safeOnly: fixture.safeOnly,
    realBinarySampleIncluded: fixture.realBinarySampleIncluded,
    analyzerStatus: "FOUNDATION_ANALYSIS_READY",
    requiredResearchCount: fixture.requiredResearch.length,
    knownSafeAssumptionCount: fixture.knownSafeAssumptions.length,
    analysis: {
      canBuildIntermediateSchema: true,
      canBuildSectionMapper: true,
      canBuildSafeWriterPlan: true,
      canEmitRealKeyboardBinaryNow: false,
      blockersBeforeRealBinary: fixture.requiredResearch
    },
    safety: {
      realBinaryWriterReady: false,
      warning: "Analyzer foundation only. No proprietary keyboard binary output."
    }
  };
}

export function runAllFormatAnalyzers() {
  const fixtures = listFormatResearchFixtures();
  const reports = fixtures.map(analyzeFormatResearchFixture);

  return {
    format: "UAOS_ALL_FORMAT_ANALYSIS_REPORTS",
    version: UAOS_PHASE53_VERSION,
    phase: 53,
    ok: reports.length === 4 && reports.every(x => x.safety.realBinaryWriterReady === false),
    reportCount: reports.length,
    reports,
    realBinaryWriterReady: false
  };
}
