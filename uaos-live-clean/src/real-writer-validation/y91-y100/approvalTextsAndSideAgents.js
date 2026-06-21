import fs from "node:fs";
import path from "node:path";

export const UAOS_Y91_Y100_VERSION = "Y91-Y100.0.0";

export const APPROVAL_TEXTS = {
  prefixScanner:
    "I approve implementing bounded read-only prefix scanner for my selected local Yamaha .STY fixtures. No full parse, no writer.",
  fullReadOnlyParse:
    "I approve full read-only parse for my selected local Yamaha .STY fixtures. No writer.",
  writerExperiment:
    "I approve an experimental Yamaha .STY writer sandbox only after parser, checksum, editor import, and hardware validation pass."
};

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function readJson(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function unsafeClaim(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    obj.realKeyboardBinaryWriteAllowed === true ||
    obj.realWriterReady === true ||
    obj.realBinaryReady === true ||
    obj.realStyWriterReady === true ||
    obj.writerUnlockReady === true ||
    obj.parserUnlockReady === true ||
    obj.fullParseUnlocked === true ||
    obj.prefixScannerImplementationUnlocked === true ||
    obj.allowRealKeyboardBinaryOutput === true ||
    obj.allowRealStyOutput === true ||
    obj.canExportRealSty === true ||
    obj.allowFullBinaryParse === true ||
    obj.allowParserImplementation === true ||
    obj.allowWriterImplementation === true ||
    obj.allowBoundedPrefixScannerImplementation === true ||
    obj.allowMarkerExtractionImplementation === true ||
    obj.deployAllowed === true ||
    obj.wroteRealKeyboardBinary === true ||
    obj.wroteRealSty === true ||
    obj?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    obj?.finalDecision?.allowRealStyOutput === true ||
    obj?.finalDecision?.canExportRealSty === true ||
    obj?.finalDecision?.allowFullBinaryParse === true ||
    obj?.finalDecision?.allowParserImplementation === true ||
    obj?.finalDecision?.allowWriterImplementation === true ||
    obj?.finalDecision?.allowBoundedPrefixScannerImplementation === true ||
    obj?.finalDecision?.allowMarkerExtractionImplementation === true ||
    obj?.finalDecision?.continueToPrefixScannerImplementation === true ||
    obj?.finalDecision?.continueToParserImplementation === true ||
    obj?.finalDecision?.continueToWriterImplementation === true ||
    obj?.finalDecision?.parserUnlockReady === true ||
    obj?.finalDecision?.writerUnlockReady === true ||
    obj?.finalDecision?.fullParseUnlocked === true ||
    obj?.finalDecision?.prefixScannerImplementationUnlocked === true ||
    obj?.finalDecision?.deployAllowed === true
  );
}

export function loadY81Y90StopGate() {
  return readJson("generated/real-writer-validation/y81-y90/UAOS_Y81_Y90_APPROVAL_REQUIRED_STOP_GATE_SUMMARY.json");
}

export function captureApprovalState() {
  const prefixEnv = (process.env.UAOS_YAMAHA_PREFIX_SCANNER_APPROVAL || "").trim();
  const fullParseEnv = (process.env.UAOS_YAMAHA_FULL_PARSE_APPROVAL || "").trim();
  const writerEnv = (process.env.UAOS_YAMAHA_WRITER_EXPERIMENT_APPROVAL || "").trim();

  return {
    format: "UAOS_Y91_APPROVAL_CAPTURE_STATE",
    version: UAOS_Y91_Y100_VERSION,
    phase: "Y91",
    status: "PASS_CAPTURED",
    approvalTexts: APPROVAL_TEXTS,
    captured: {
      prefixScannerExactMatch: prefixEnv === APPROVAL_TEXTS.prefixScanner,
      fullReadOnlyParseExactMatch: fullParseEnv === APPROVAL_TEXTS.fullReadOnlyParse,
      writerExperimentExactMatch: writerEnv === APPROVAL_TEXTS.writerExperiment
    },
    effectiveDecision: {
      prefixScannerCanBePrepared: true,
      prefixScannerCanBeImplementedNow: false,
      fullParseCanBePrepared: true,
      fullParseCanBeImplementedNow: false,
      writerCanBePrepared: true,
      writerCanBeImplementedNow: false
    },
    finalDecision: {
      approvalTextsReady: true,
      approvalCaptureReady: true,
      prefixScannerApprovalCaptured: prefixEnv === APPROVAL_TEXTS.prefixScanner,
      fullReadOnlyParseApprovalCaptured: fullParseEnv === APPROVAL_TEXTS.fullReadOnlyParse,
      writerExperimentApprovalCaptured: writerEnv === APPROVAL_TEXTS.writerExperiment,
      prefixScannerImplementationUnlocked: false,
      fullParseUnlocked: false,
      parserUnlockReady: false,
      writerUnlockReady: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
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
      captureOnly: true,
      noDeploy: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createSideAgentPrewritePlans(approvalState) {
  const agents = [
    {
      id: "prefixScannerAgent",
      title: "Bounded Prefix Scanner Agent",
      outputFile: "generated/real-writer-validation/y91-y100/side-agents/PREFIX_SCANNER_AGENT_PLAN.json",
      status: "PENDING_APPROVAL",
      plannedFiles: [
        "src/real-writer-validation/prefix-scanner/boundedPrefixScanner.js",
        "scripts/UAOS_RUN_BOUNDED_PREFIX_SCAN.mjs"
      ],
      allowedNow: false,
      reason: "Needs separate implementation launcher after explicit approval."
    },
    {
      id: "markerIndexAgent",
      title: "Marker Index Agent",
      outputFile: "generated/real-writer-validation/y91-y100/side-agents/MARKER_INDEX_AGENT_PLAN.json",
      status: "PENDING_APPROVAL",
      plannedFiles: [
        "src/real-writer-validation/marker-index/yamahaMarkerIndex.js",
        "scripts/UAOS_RUN_MARKER_INDEX.mjs"
      ],
      allowedNow: false,
      reason: "Marker extraction implementation remains blocked."
    },
    {
      id: "fullParseAgent",
      title: "Full Read-only Parser Agent",
      outputFile: "generated/real-writer-validation/y91-y100/side-agents/FULL_PARSE_AGENT_PLAN.json",
      status: "LOCKED",
      plannedFiles: [
        "src/real-writer-validation/full-parser/yamahaReadOnlyParser.js"
      ],
      allowedNow: false,
      reason: "Full binary parse approval is separate and not unlocked."
    },
    {
      id: "writerAgent",
      title: "Real Writer Agent",
      outputFile: "generated/real-writer-validation/y91-y100/side-agents/WRITER_AGENT_PLAN.json",
      status: "HARD_LOCKED",
      plannedFiles: [
        "src/real-writer-validation/writer/yamahaStyWriterSandbox.js"
      ],
      allowedNow: false,
      reason: "Writer requires parser, checksum, editor, hardware validation, and separate approval."
    },
    {
      id: "qaAgent",
      title: "Safety QA Agent",
      outputFile: "generated/real-writer-validation/y91-y100/side-agents/QA_AGENT_PLAN.json",
      status: "READY",
      plannedFiles: [
        "scripts/UAOS_REAL_WRITER_SAFETY_QA.mjs"
      ],
      allowedNow: true,
      reason: "QA-only planning is safe."
    }
  ];

  for (const agent of agents) {
    writeJson(agent.outputFile, {
      format: `UAOS_Y92_${agent.id.toUpperCase()}_PREWRITE_PLAN`,
      version: UAOS_Y91_Y100_VERSION,
      phase: "Y92",
      agent,
      approvalState: {
        prefixScannerApprovalCaptured: approvalState.finalDecision.prefixScannerApprovalCaptured,
        fullReadOnlyParseApprovalCaptured: approvalState.finalDecision.fullReadOnlyParseApprovalCaptured,
        writerExperimentApprovalCaptured: approvalState.finalDecision.writerExperimentApprovalCaptured
      },
      finalDecision: {
        prewritePlanReady: true,
        implementationAllowedNow: agent.allowedNow === true && agent.id === "qaAgent",
        prefixScannerImplementationUnlocked: false,
        fullParseUnlocked: false,
        parserUnlockReady: false,
        writerUnlockReady: false,
        allowBoundedPrefixScannerImplementation: false,
        allowMarkerExtractionImplementation: false,
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
        planningOnly: true,
        noDeploy: true,
        readOnly: true,
        wroteRealKeyboardBinary: false,
        realBinaryBlocked: true
      }
    });
  }

  return {
    format: "UAOS_Y92_SIDE_AGENT_PREWRITE_PLANS",
    version: UAOS_Y91_Y100_VERSION,
    phase: "Y92",
    status: "PASS",
    agentCount: agents.length,
    agents,
    finalDecision: {
      sideAgentPlansReady: true,
      sideAgentImplementationAllowedNow: false,
      prefixScannerImplementationUnlocked: false,
      fullParseUnlocked: false,
      parserUnlockReady: false,
      writerUnlockReady: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
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
      planningOnly: true,
      noDeploy: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY93PreparedFileRegistry(sideAgents) {
  return {
    format: "UAOS_Y93_PREPARED_FILE_REGISTRY",
    version: UAOS_Y91_Y100_VERSION,
    phase: "Y93",
    status: "PASS_PENDING_APPROVAL",
    preparedFiles: sideAgents.agents.flatMap(agent =>
      agent.plannedFiles.map(file => ({
        agentId: agent.id,
        file,
        status: agent.allowedNow ? "QA_PLAN_READY" : "PENDING_APPROVAL",
        createNow: false
      }))
    ),
    finalDecision: {
      preparedFileRegistryReady: true,
      writePreparedImplementationFilesNow: false,
      prefixScannerImplementationUnlocked: false,
      fullParseUnlocked: false,
      parserUnlockReady: false,
      writerUnlockReady: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      deployAllowed: false
    },
    safety: {
      registryOnly: true,
      noDeploy: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY94ApprovalTextsDocument() {
  return {
    format: "UAOS_Y94_APPROVAL_TEXTS_DOCUMENT",
    version: UAOS_Y91_Y100_VERSION,
    phase: "Y94",
    status: "PASS",
    texts: [
      {
        id: "prefixScanner",
        text: APPROVAL_TEXTS.prefixScanner,
        effect: "Allows a future dedicated bounded prefix scanner implementation launcher only. No full parse, no writer."
      },
      {
        id: "fullReadOnlyParse",
        text: APPROVAL_TEXTS.fullReadOnlyParse,
        effect: "Allows future full read-only parse launcher only. No writer."
      },
      {
        id: "writerExperiment",
        text: APPROVAL_TEXTS.writerExperiment,
        effect: "Only after parser/checksum/editor/hardware validation. Not valid now."
      }
    ],
    finalDecision: {
      approvalTextsDocumentReady: true,
      implementationUnlockedNow: false,
      prefixScannerImplementationUnlocked: false,
      fullParseUnlocked: false,
      writerUnlockReady: false,
      allowBoundedPrefixScannerImplementation: false,
      allowFullBinaryParse: false,
      allowWriterImplementation: false,
      realKeyboardBinaryWriteAllowed: false,
      deployAllowed: false
    },
    safety: {
      documentOnly: true,
      noDeploy: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createY95FinalSideAgentGate(approvalState, sideAgents, preparedRegistry) {
  return {
    format: "UAOS_Y95_FINAL_SIDE_AGENT_GATE",
    version: UAOS_Y91_Y100_VERSION,
    phase: "Y95",
    status: "PASS_LOCKED",
    gate: {
      approvalCaptured: approvalState.captured,
      agentPlansReady: true,
      implementationFilesWritten: false,
      reason: "This launcher prepares approval texts and agent plans only."
    },
    finalDecision: {
      finalSideAgentGateReady: true,
      sideAgentsPrewritten: true,
      sideAgentsImplemented: false,
      prefixScannerImplementationUnlocked: false,
      fullParseUnlocked: false,
      parserUnlockReady: false,
      writerUnlockReady: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
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
      locked: true,
      noDeploy: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function runY91Y100ApprovalTextsAndSideAgents() {
  const previous = loadY81Y90StopGate();
  const previousReady = previous?.approvalRequiredStopGateReady === true && !unsafeClaim(previous);

  const y91 = captureApprovalState();
  const y92 = createSideAgentPrewritePlans(y91);
  const y93 = createY93PreparedFileRegistry(y92);
  const y94 = createY94ApprovalTextsDocument();
  const y95 = createY95FinalSideAgentGate(y91, y92, y93);

  return {
    format: "UAOS_Y91_Y100_APPROVAL_TEXTS_AND_SIDE_AGENTS_REPORT",
    version: UAOS_Y91_Y100_VERSION,
    phases: ["Y91", "Y92", "Y93", "Y94", "Y95", "Y96", "Y97", "Y98", "Y99", "Y100"],
    status: previousReady ? "PASS" : "PASS_PREVIOUS_GATE_MISSING",
    previousReady,
    reports: { y91, y92, y93, y94, y95 },
    finalDecision: {
      approvalTextsReady: true,
      approvalCaptureReady: true,
      sideAgentPlansReady: true,
      preparedFileRegistryReady: true,
      implementationFilesWritten: false,
      prefixScannerImplementationUnlocked: false,
      fullParseUnlocked: false,
      parserUnlockReady: false,
      writerUnlockReady: false,
      allowReadOnlyAnalysis: true,
      allowBoundedPrefixScanPlanning: true,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
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
      planningOnly: true,
      localOnly: true,
      noDeploy: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateY91Y100ApprovalTextsAndSideAgents(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y91_Y100_APPROVAL_TEXTS_AND_SIDE_AGENTS_REPORT") errors.push("Invalid report format.");
  if (!String(report?.status || "").startsWith("PASS")) errors.push("Status must be PASS.");
  if (report?.finalDecision?.implementationFilesWritten !== false) errors.push("Implementation files must not be written.");
  if (report?.finalDecision?.prefixScannerImplementationUnlocked !== false) errors.push("Prefix scanner implementation must remain locked.");
  if (report?.finalDecision?.fullParseUnlocked !== false) errors.push("Full parse must remain locked.");
  if (report?.finalDecision?.parserUnlockReady !== false) errors.push("Parser unlock must remain false.");
  if (report?.finalDecision?.writerUnlockReady !== false) errors.push("Writer unlock must remain false.");
  if (report?.finalDecision?.allowBoundedPrefixScannerImplementation !== false) errors.push("Prefix scanner implementation must remain blocked.");
  if (report?.finalDecision?.allowMarkerExtractionImplementation !== false) errors.push("Marker extraction must remain blocked.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowParserImplementation !== false) errors.push("Parser implementation must remain blocked.");
  if (report?.finalDecision?.allowWriterImplementation !== false) errors.push("Writer implementation must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.finalDecision?.deployAllowed !== false) errors.push("Deploy must be blocked.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
