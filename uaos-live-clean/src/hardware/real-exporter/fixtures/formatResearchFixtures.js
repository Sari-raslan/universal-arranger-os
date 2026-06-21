export const UAOS_PHASE52_VERSION = "52.0.0";

export const UAOS_FORMAT_RESEARCH_FIXTURES = {
  korg: {
    target: "korg",
    futureFormats: [".STY", ".SET"],
    fixtureFile: "korg-format-fixture.json",
    safeOnly: true,
    realBinarySampleIncluded: false,
    requiredResearch: [
      "container header structure",
      "style section table",
      "pattern/chord variation mapping",
      "track/channel encoding",
      "checksum or package metadata rules"
    ],
    knownSafeAssumptions: [
      "UAOS can map sections and tracks into an intermediate JSON schema",
      "UAOS must not emit proprietary binary until validated",
      "Roundtrip validation is required before any user-facing real export"
    ]
  },
  yamaha: {
    target: "yamaha",
    futureFormats: [".STY"],
    fixtureFile: "yamaha-format-fixture.json",
    safeOnly: true,
    realBinarySampleIncluded: false,
    requiredResearch: [
      "style container/chunk structure",
      "MAIN/INTRO/FILL/ENDING mapping",
      "OTS metadata mapping",
      "CASM-like behavior compatibility",
      "checksum and device compatibility rules"
    ],
    knownSafeAssumptions: [
      "UAOS can prepare MIDI section phrases",
      "UAOS can prepare OTS metadata as JSON",
      "Real writer requires fixtures and editor/device validation"
    ]
  },
  roland: {
    target: "roland",
    futureFormats: [".STL", ".PRS"],
    fixtureFile: "roland-format-fixture.json",
    safeOnly: true,
    realBinarySampleIncluded: false,
    requiredResearch: [
      "performance structure mapping",
      "variation/fill/intro/ending model",
      "device family differences BK/E-A",
      "style package metadata",
      "validation workflow"
    ],
    knownSafeAssumptions: [
      "UAOS can prepare performance maps",
      "UAOS can map style sections to Roland concepts",
      "Real writer needs separate model/device validation"
    ]
  },
  ketron: {
    target: "ketron",
    futureFormats: [".PAT", ".MSP", ".KST"],
    fixtureFile: "ketron-format-fixture.json",
    safeOnly: true,
    realBinarySampleIncluded: false,
    requiredResearch: [
      "style package structure",
      "audio drum reference rules",
      "arranger section mapping",
      "phrase/channel metadata",
      "validation workflow for SD/Audya families"
    ],
    knownSafeAssumptions: [
      "UAOS can prepare audio drum references safely",
      "UAOS can map arranger sections as JSON",
      "Real writer needs hardware/editor validation"
    ]
  }
};

export function listFormatResearchFixtures() {
  return Object.values(UAOS_FORMAT_RESEARCH_FIXTURES);
}

export function getFormatResearchFixture(target) {
  const fixture = UAOS_FORMAT_RESEARCH_FIXTURES[target];
  if (!fixture) throw new Error(`Unknown format research fixture: ${target}`);
  return fixture;
}

export function validateFormatResearchFixture(fixture) {
  const errors = [];
  if (!fixture?.target) errors.push("Missing target.");
  if (!fixture?.futureFormats?.length) errors.push("Missing future formats.");
  if (!fixture?.fixtureFile) errors.push("Missing fixture file.");
  if (fixture?.safeOnly !== true) errors.push("Fixture must be safeOnly.");
  if (fixture?.realBinarySampleIncluded !== false) errors.push("Must not include real binary sample.");
  if (!fixture?.requiredResearch?.length) errors.push("Missing required research.");
  if (!fixture?.knownSafeAssumptions?.length) errors.push("Missing safe assumptions.");
  return { ok: errors.length === 0, errors };
}
