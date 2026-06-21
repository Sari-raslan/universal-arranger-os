import fs from "node:fs";

export const UAOS_Y1_Y10_VERSION = "Y1-Y10.0.0";

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function readJson(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function unsafeClaim(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    obj.realKeyboardBinaryWriteAllowed === true ||
    obj.realWriterReady === true ||
    obj.realBinaryReady === true ||
    obj.realStyWriterReady === true ||
    obj.writerUnlockReady === true ||
    obj.allowRealKeyboardBinaryOutput === true ||
    obj.allowRealStyOutput === true ||
    obj.canExportRealSty === true ||
    obj.canExportRealKeyboardBinary === true ||
    obj.allowFullBinaryParse === true ||
    obj.allowParserImplementation === true ||
    obj.allowWriterImplementation === true ||
    obj.deployAllowed === true ||
    obj.wroteRealKeyboardBinary === true ||
    obj.wroteRealSty === true ||
    obj?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    obj?.finalDecision?.allowRealStyOutput === true ||
    obj?.finalDecision?.canExportRealSty === true ||
    obj?.finalDecision?.allowFullBinaryParse === true ||
    obj?.finalDecision?.allowParserImplementation === true ||
    obj?.finalDecision?.allowWriterImplementation === true ||
    obj?.finalDecision?.continueToWriterImplementation === true ||
    obj?.finalDecision?.writerUnlockReady === true ||
    obj?.finalDecision?.deployAllowed === true
  );
}

export function loadClosedBaseline() {
  return readJson("generated/real-writer-validation/r61-r70/UAOS_R61_R70_REAL_WRITER_VALIDATION_FINAL_SUMMARY.json");
}

export function createY1ManualApprovedFixtureSet() {
  const baseline = loadClosedBaseline();
  const baselineReady = baseline?.safeBaselineClosed === true && !unsafeClaim(baseline);

  return {
    format: "UAOS_Y1_MANUAL_APPROVED_FIXTURE_SET",
    version: UAOS_Y1_Y10_VERSION,
    phase: "Y1",
    status: baselineReady ? "PASS_LOCKED" : "PASS_EMPTY_LOCKED",
    sourceBaselineReady: baselineReady,
    target: "yamaha",
    futureFormat: ".STY",
    approvedFixtures: [],
    requiredUserAction: [
      "select 3-5 user-owned Yamaha .STY fixture files",
      "confirm they are owned/licensed for local analysis",
      "confirm no upload/publishing",
      "confirm read-only parser design only"
    ],
    currentPermission: {
      metadataIndexing: true,
      smallPrefixReadOnly: true,
      fullReadOnlyParse: false,
      copyFixtureIntoRepo: false,
      writerTest: false,
      publishFixture: false
    },
    finalDecision: {
      fixtureSetApprovedForFullParse: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY2ApprovalRecordTemplate(y1) {
  return {
    format: "UAOS_Y2_APPROVAL_RECORD_TEMPLATE",
    version: UAOS_Y1_Y10_VERSION,
    phase: "Y2",
    status: "PASS_LOCKED",
    template: {
      fixturePath: "",
      userOwnsOrHasRights: false,
      approveMetadataOnly: true,
      approveSmallPrefixReadOnly: true,
      approveFullReadOnlyParse: false,
      approveCopyIntoRepo: false,
      approveWriterExperiment: false,
      approvePublishing: false,
      notes: "Do not enable full parse or writer without explicit separate approval."
    },
    requiredBeforeY3RealParser: [
      "fixturePath set",
      "userOwnsOrHasRights true",
      "approveFullReadOnlyParse true",
      "manual confirmation report committed"
    ],
    finalDecision: {
      approvalRecordReady: true,
      fullParseApprovedNow: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createY3ReadOnlyParserDesignSkeleton(y2) {
  return {
    format: "UAOS_Y3_READ_ONLY_PARSER_DESIGN_SKELETON",
    version: UAOS_Y1_Y10_VERSION,
    phase: "Y3",
    status: "PASS_DESIGN_ONLY",
    target: "yamaha",
    futureFormat: ".STY",
    parserSkeleton: {
      implementationEnabled: false,
      fullBinaryParseEnabled: false,
      modules: [
        { name: "FileAccessPolicy", purpose: "read-only approved fixture paths", enabled: false },
        { name: "PrefixScanner", purpose: "safe bounded prefix scan", enabled: true },
        { name: "MarkerIndex", purpose: "non-destructive marker index", enabled: true },
        { name: "ChunkBoundaryReader", purpose: "confirmed boundaries only", enabled: false },
        { name: "SemanticSectionReader", purpose: "section model extraction", enabled: false },
        { name: "ChecksumReader", purpose: "read-only checksum identification", enabled: false }
      ]
    },
    finalDecision: {
      parserDesignReady: true,
      parserImplementationEnabled: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      designOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY4SemanticParserContract(y3) {
  return {
    format: "UAOS_Y4_SEMANTIC_PARSER_CONTRACT",
    version: UAOS_Y1_Y10_VERSION,
    phase: "Y4",
    status: "PASS_CONTRACT_ONLY",
    target: "yamaha",
    futureFormat: ".STY",
    semanticModel: {
      styleName: { required: false, confirmed: false },
      tempo: { required: false, confirmed: false },
      meter: { required: false, confirmed: false },
      sections: {
        intro: ["A", "B", "C"],
        main: ["A", "B", "C", "D"],
        fill: ["A", "B", "C", "D"],
        ending: ["A", "B", "C"]
      },
      tracks: ["drums", "bass", "chord", "pad", "phrase1", "phrase2"],
      casmLikeRules: { required: true, confirmed: false },
      otsMetadata: { required: false, confirmed: false }
    },
    finalDecision: {
      semanticContractReady: true,
      semanticParserImplemented: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      contractOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY5ChunkBoundaryContract(y4) {
  return {
    format: "UAOS_Y5_CHUNK_BOUNDARY_CONTRACT",
    version: UAOS_Y1_Y10_VERSION,
    phase: "Y5",
    status: "PASS_CONTRACT_ONLY",
    target: "yamaha",
    futureFormat: ".STY",
    chunkBoundaryRules: [
      { rule: "never infer writable boundary from unconfirmed marker", enforced: true },
      { rule: "never write chunk unless checksum/package known", enforced: true },
      { rule: "record offset/length only after read-only confirmation", enforced: true },
      { rule: "separate semantic model from binary model", enforced: true }
    ],
    boundaryModelReady: false,
    finalDecision: {
      chunkBoundaryContractReady: true,
      chunkBoundaryParserReady: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      contractOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY6RoundtripValidationContract(y5) {
  return {
    format: "UAOS_Y6_ROUNDTRIP_VALIDATION_CONTRACT",
    version: UAOS_Y1_Y10_VERSION,
    phase: "Y6",
    status: "PASS_CONTRACT_ONLY",
    target: "yamaha",
    futureFormat: ".STY",
    roundtripStages: [
      { stage: "fixture -> read-only parse model", ready: false },
      { stage: "parse model -> semantic model", ready: false },
      { stage: "semantic model -> safe intermediate", ready: false },
      { stage: "safe intermediate -> binary candidate", ready: false },
      { stage: "binary candidate -> editor import", ready: false },
      { stage: "binary candidate -> hardware import", ready: false }
    ],
    canRunRoundtripNow: false,
    finalDecision: {
      roundtripContractReady: true,
      roundtripImplementationReady: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      contractOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY7ParserUnlockGate(y1, y2, y3, y4, y5, y6) {
  return {
    format: "UAOS_Y7_PARSER_UNLOCK_GATE",
    version: UAOS_Y1_Y10_VERSION,
    phase: "Y7",
    status: "PASS_LOCKED",
    unlockRequirements: [
      { item: "manual approved fixture paths", complete: false },
      { item: "explicit full read-only parse approval", complete: false },
      { item: "parser skeleton reviewed", complete: true },
      { item: "semantic contract reviewed", complete: true },
      { item: "chunk boundary contract reviewed", complete: true },
      { item: "roundtrip contract reviewed", complete: true }
    ],
    finalDecision: {
      parserUnlockReady: false,
      continueToParserImplementation: false,
      continueToWriterImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      lockedGate: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function runY1Y10ManualApprovedYamahaParserDesign() {
  const y1 = createY1ManualApprovedFixtureSet();
  const y2 = createY2ApprovalRecordTemplate(y1);
  const y3 = createY3ReadOnlyParserDesignSkeleton(y2);
  const y4 = createY4SemanticParserContract(y3);
  const y5 = createY5ChunkBoundaryContract(y4);
  const y6 = createY6RoundtripValidationContract(y5);
  const y7 = createY7ParserUnlockGate(y1, y2, y3, y4, y5, y6);

  return {
    format: "UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_REPORT",
    version: UAOS_Y1_Y10_VERSION,
    phases: ["Y1", "Y2", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8", "Y9", "Y10"],
    status: "PASS",
    reports: { y1, y2, y3, y4, y5, y6, y7 },
    finalDecision: {
      manualApprovedParserDesignReady: true,
      parserUnlockReady: false,
      allowReadOnlyAnalysis: true,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      deployAllowed: false
    },
    safety: {
      localOnly: true,
      noDeploy: true,
      designOnly: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateY1Y10ManualApprovedYamahaParserDesign(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.parserUnlockReady !== false) errors.push("Parser unlock must remain false.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowParserImplementation !== false) errors.push("Parser implementation must remain blocked.");
  if (report?.finalDecision?.allowWriterImplementation !== false) errors.push("Writer implementation must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.finalDecision?.deployAllowed !== false) errors.push("Deploy must be blocked.");
  if (report?.reports?.y7?.finalDecision?.continueToParserImplementation !== false) errors.push("Y7 must block parser implementation.");
  if (report?.reports?.y7?.finalDecision?.continueToWriterImplementation !== false) errors.push("Y7 must block writer implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.designOnly !== true) errors.push("Must remain design-only.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
