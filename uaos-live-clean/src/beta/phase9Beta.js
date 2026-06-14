export const PHASE9_SCHEMA_VERSION = 1;
export const RELEASE_CHANNELS = Object.freeze(["alpha", "beta", "release-candidate", "stable"]);
export const RELEASE_STATUSES = Object.freeze([
  "CODE_BLOCKED",
  "CODE_READY_MANUAL_VALIDATION_REQUIRED",
  "CODE_READY_EXTERNAL_APPROVALS_REQUIRED",
  "RELEASE_CANDIDATE_READY_UNSIGNED",
  "RELEASE_CANDIDATE_READY_SIGNED",
  "PRODUCTION_READY"
]);

export const DEFAULT_BETA_FLAGS = Object.freeze({
  betaEnabled: true,
  cloudSyncBeta: false,
  aiStudioBeta: true,
  hardwareProfilesBeta: true,
  sysexBeta: false,
  dawBeta: true,
  recordingBeta: true,
  billingBeta: false,
  updaterBeta: false,
  diagnosticsBeta: true,
  feedbackBeta: true,
  remoteAiBeta: false,
  cloudAssetUploadBeta: false
});

export const BETA_LIMITS = Object.freeze({
  maxLocalProjectsWarning: 25,
  maxTracksWarning: 48,
  maxSamplerVoices: 64,
  maxAnalysisDurationSeconds: 180,
  maxUploadSizeBytes: 0,
  maxMidiEventsWarning: 12000,
  maxDiagnosticsLogBytes: 128000,
  maxRecoverySnapshots: 5,
  maxUndoHistory: 100,
  cloudStorageEnabled: false
});

export const PERFORMANCE_BUDGET = Object.freeze({
  startupMsWarning: 3000,
  routeRenderMsWarning: 800,
  bundleKbWarning: 600,
  diagnosticsLogBytes: BETA_LIMITS.maxDiagnosticsLogBytes,
  waveformCacheItems: 24,
  midiLogEvents: 1000,
  meterFps: 15,
  animationsRespectReducedMotion: true
});

export const DEFAULT_SHORTCUTS = Object.freeze({
  playStop: "Space",
  record: "KeyR",
  panic: "Escape",
  save: "Control+KeyS",
  undo: "Control+KeyZ",
  redo: "Control+Shift+KeyZ",
  split: "KeyS",
  delete: "Delete",
  duplicate: "Control+KeyD",
  zoomIn: "Equal",
  zoomOut: "Minus",
  loop: "KeyL",
  metronome: "KeyM",
  openMixer: "KeyX",
  openSampler: "Digit6",
  openArranger: "Digit4",
  openAiStudio: "Digit7",
  openDiagnostics: "F12"
});

const ONBOARDING_STEPS = [
  "welcome",
  "language",
  "locale-foundation",
  "privacy-summary",
  "offline-first",
  "audio-check",
  "midi-check",
  "microphone-optional",
  "accounts-api-state",
  "local-only-mode",
  "optional-sign-in",
  "feature-selection",
  "hardware-optional",
  "demo-project",
  "finish"
];

export function createReleaseCandidateMetadata(overrides = {}) {
  const timestamp = overrides.buildTimestamp || new Date().toISOString();
  const channel = overrides.channel || "release-candidate";
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    releaseId: overrides.releaseId || `uaos-rc-${timestamp.slice(0, 10).replaceAll("-", "")}`,
    version: overrides.version || "1.0.0-beta.9",
    frontendVersion: overrides.frontendVersion || "11.0.0",
    backendVersion: overrides.backendVersion || "phase8-cloud-foundation",
    apiVersion: overrides.apiVersion || "v1-beta",
    installerVersion: overrides.installerVersion || "1.0.0-beta.9",
    buildNumber: overrides.buildNumber || "local-phase9",
    channel,
    stable: channel === "stable",
    commitSha: overrides.commitSha || null,
    buildTimestamp: timestamp,
    schemaVersions: {
      session: 7,
      phase9: PHASE9_SCHEMA_VERSION,
      cloud: 1,
      daw: 1,
      hardware: 1
    },
    supportedPlatforms: ["web", "windows-desktop-code-ready"],
    minimumWindowsVersion: "Windows 10 19045",
    architecture: ["x64"],
    packagedFiles: overrides.packagedFiles || ["electron", "uaos-live-clean/dist", "package.json"],
    checksums: overrides.checksums || [],
    signingStatus: overrides.signingStatus || "unsigned",
    testStatus: overrides.testStatus || "not-run",
    manualValidationStatus: overrides.manualValidationStatus || "required",
    externalApprovalStatus: overrides.externalApprovalStatus || "required",
    knownIssues: overrides.knownIssues || [],
    blockers: overrides.blockers || [
      "Windows signing certificate missing",
      "Manual audio, MIDI and hardware validation required",
      "External legal, privacy, Stripe, SMTP and database approvals required"
    ],
    releaseNotes: overrides.releaseNotes || [
      "Public beta foundation for local testing",
      "No production services activated",
      "Cloud sync, billing, updater and uploads disabled by default"
    ],
    rolloutState: overrides.rolloutState || "disabled-local-only",
    activationEnabled: false
  };
}

export function validateReleaseCandidate(model) {
  const errors = [];
  if (!model || typeof model !== "object") errors.push("release model required");
  if (model && !RELEASE_CHANNELS.includes(model.channel)) errors.push("unsupported release channel");
  if (model && model.channel === "stable" && model.activationEnabled) errors.push("stable activation requires production evidence");
  if (model && model.signingStatus === "signed" && model.externalApprovalStatus !== "complete") errors.push("signed status requires external approval evidence");
  if (model && model.activationEnabled !== false) errors.push("activation must be disabled by default");
  if (model && !/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/i.test(model.version || "")) errors.push("invalid semantic version");
  return { valid: errors.length === 0, errors };
}

export function normalizeFeatureFlags(local = {}, environment = {}, entitlements = {}) {
  const values = { ...DEFAULT_BETA_FLAGS };
  const unknown = [];
  const apply = (source, sourceName) => {
    for (const [key, value] of Object.entries(source || {})) {
      if (!(key in values)) {
        unknown.push({ key, source: sourceName });
        continue;
      }
      values[key] = Boolean(value);
    }
  };
  apply(environment, "environment");
  apply(entitlements, "entitlement");
  apply(local, "local");
  values.sysexBeta = false;
  values.billingBeta = false;
  values.remoteAiBeta = false;
  values.cloudAssetUploadBeta = false;
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    values,
    unknown,
    remoteConfiguration: "disabled",
    overrides: Object.keys(local || {}),
    audit: {
      generatedAt: new Date().toISOString(),
      sourceOrder: ["defaults", "environment", "entitlement", "local"]
    }
  };
}

export function createOnboardingState(overrides = {}) {
  const currentStep = ONBOARDING_STEPS.includes(overrides.currentStep) ? overrides.currentStep : "welcome";
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    steps: ONBOARDING_STEPS,
    currentStep,
    completedSteps: Array.isArray(overrides.completedSteps) ? overrides.completedSteps.filter((step) => ONBOARDING_STEPS.includes(step)) : [],
    skippedOptionalSteps: Array.isArray(overrides.skippedOptionalSteps) ? overrides.skippedOptionalSteps : [],
    locale: overrides.locale || "en",
    reducedMotion: Boolean(overrides.reducedMotion),
    accountRequired: false,
    cloudRequired: false,
    microphoneRequired: false,
    hiddenConsent: false,
    finished: Boolean(overrides.finished)
  };
}

export function advanceOnboarding(state, action = {}) {
  const current = createOnboardingState(state);
  const index = current.steps.indexOf(current.currentStep);
  const completedSteps = new Set(current.completedSteps);
  completedSteps.add(current.currentStep);
  const nextIndex = Math.min(index + 1, current.steps.length - 1);
  const next = {
    ...current,
    currentStep: current.steps[nextIndex],
    completedSteps: [...completedSteps],
    locale: action.locale || current.locale,
    reducedMotion: action.reducedMotion ?? current.reducedMotion,
    finished: current.steps[nextIndex] === "finish"
  };
  if (action.skipOptional) next.skippedOptionalSteps = [...new Set([...next.skippedOptionalSteps, current.currentStep])];
  return next;
}

export function resetOnboarding(locale = "en") {
  return createOnboardingState({ locale });
}

export function createSyntheticDemoProject() {
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    id: "uaos-demo-synthetic-001",
    name: "UAOS Synthetic Beta Demo",
    legal: {
      source: "synthetic",
      commercialSamples: false,
      copyrightedSong: false,
      internetRequired: false
    },
    tempo: 96,
    key: "C minor",
    arrangerSections: ["intro", "variation-a", "fill-a", "variation-b", "ending"],
    chordProgression: ["Cm", "Ab", "Bb", "G7"],
    tracks: [
      { id: "drums", type: "drum", pattern: "synthetic-four-on-floor", midiEvents: 16 },
      { id: "bass", type: "bass", pattern: "root-fifth-octave", midiEvents: 16 },
      { id: "chords", type: "chord", pattern: "short-stabs", midiEvents: 12 },
      { id: "pad", type: "pad", pattern: "held-synthetic-pad", midiEvents: 4 },
      { id: "phrase", type: "phrase", pattern: "generated-safe-phrase", midiEvents: 20 }
    ],
    samplerPresets: [
      { id: "demo-tone", name: "Generated Demo Tone", generated: true, sampleBytes: 0 },
      { id: "demo-click", name: "Generated Demo Click", generated: true, sampleBytes: 0 }
    ],
    midiClips: [
      { id: "clip-drums", trackId: "drums", startTick: 0, lengthTicks: 1536 },
      { id: "clip-bass", trackId: "bass", startTick: 0, lengthTicks: 1536 }
    ],
    automation: [{ target: "mixer.masterGain", points: [{ tick: 0, value: 0.78 }, { tick: 1536, value: 0.9 }] }],
    mixer: { masterGain: 0.85, tracks: { drums: 0.8, bass: 0.72, chords: 0.68, pad: 0.55, phrase: 0.62 } },
    markers: [{ tick: 0, label: "Demo Start" }, { tick: 1536, label: "Demo Loop" }],
    aiAnalysis: { label: "Demo mock result", confidence: 0.72, remoteModel: false, rawAudioStored: false },
    hardwareProfile: { id: "mock-beta-keyboard", brand: "UAOS", sysexEnabled: false },
    deterministicSeed: "uaos-phase9-demo"
  };
}

export function validateDemoProject(project) {
  const errors = [];
  if (!project || typeof project !== "object") errors.push("project required");
  if (project?.legal?.source !== "synthetic") errors.push("demo must be synthetic");
  if (project?.legal?.commercialSamples) errors.push("commercial samples are not allowed");
  if (project?.legal?.copyrightedSong) errors.push("copyrighted songs are not allowed");
  if (project?.legal?.internetRequired) errors.push("demo must open offline");
  if (!Array.isArray(project?.tracks) || project.tracks.length < 5) errors.push("demo tracks missing");
  if (project?.samplerPresets?.some((preset) => preset.generated !== true)) errors.push("demo presets must be generated");
  return { valid: errors.length === 0, errors };
}

export function createRecoveryState(overrides = {}) {
  const snapshots = Array.isArray(overrides.snapshots) ? overrides.snapshots.slice(-BETA_LIMITS.maxRecoverySnapshots) : [];
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    lastSessionMetadata: overrides.lastSessionMetadata || null,
    dirty: Boolean(overrides.dirty),
    snapshots,
    crashMarker: overrides.crashMarker || null,
    cleanShutdownMarker: overrides.cleanShutdownMarker || new Date().toISOString(),
    missingAssets: Array.isArray(overrides.missingAssets) ? overrides.missingAssets : [],
    rawAudioStored: false
  };
}

export function createRecoverySnapshot(state, metadata) {
  const current = createRecoveryState(state);
  return createRecoveryState({
    ...current,
    dirty: true,
    snapshots: [...current.snapshots, { id: `snapshot-${Date.now()}`, createdAt: new Date().toISOString(), metadata }],
    cleanShutdownMarker: null
  });
}

export function validateRecoveryPayload(payload) {
  if (!payload || typeof payload !== "object") return { valid: false, error: "Recovery payload is missing." };
  if (payload.rawAudio || payload.audioBuffer || payload.blob) return { valid: false, error: "Recovery payload cannot contain raw audio." };
  return { valid: true };
}

export function sanitizeDiagnostics(value) {
  return JSON.parse(JSON.stringify(value || {}, (key, item) => {
    if (/password|token|cookie|secret|stripe/i.test(key)) return "[redacted]";
    if (["rawAudio", "audioBuffer", "privateProjectContent"].includes(key)) return "[redacted]";
    if (typeof item === "string" && item.length > 2000) return `${item.slice(0, 2000)}...`;
    return item;
  }));
}

export function createDiagnosticsBundle(input = {}) {
  const bundle = {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    appVersion: input.appVersion || "1.0.0-beta.9",
    buildNumber: input.buildNumber || "local-phase9",
    platform: input.platform || "browser",
    nodeElectron: input.nodeElectron || { node: "unknown", electron: "not-detected" },
    browserCapabilities: input.browserCapabilities || {},
    webAudio: input.webAudio || "unknown",
    midi: input.midi || "unknown",
    microphonePermission: input.microphonePermission || "not-requested",
    selectedDeviceProfile: input.selectedDeviceProfile || null,
    apiHealth: input.apiHealth || "unknown",
    providers: input.providers || { database: "memory-dev", stripe: "disabled", smtp: "memory", cloudSync: "disabled" },
    featureFlags: normalizeFeatureFlags(input.featureFlags || {}).values,
    testGateStatus: input.testGateStatus || "not-run",
    recentLogs: Array.isArray(input.recentLogs) ? input.recentLogs.slice(-50) : [],
    errorCounts: input.errorCounts || {},
    missingAssets: input.missingAssets || [],
    projectSchemaVersion: input.projectSchemaVersion || 7,
    privateProjectContentIncluded: false,
    rawAudioIncluded: false
  };
  return sanitizeDiagnostics(bundle);
}

export function createFeedbackDraft(overrides = {}) {
  const category = overrides.category || "bug";
  const severity = overrides.severity || "medium";
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    id: overrides.id || `feedback-${Date.now()}`,
    category,
    severity,
    description: String(overrides.description || "").slice(0, 4000),
    reproductionSteps: Array.isArray(overrides.reproductionSteps) ? overrides.reproductionSteps.slice(0, 12) : [],
    expectedResult: String(overrides.expectedResult || "").slice(0, 1000),
    actualResult: String(overrides.actualResult || "").slice(0, 1000),
    diagnosticsConsent: Boolean(overrides.diagnosticsConsent),
    screenshotMetadata: overrides.screenshotMetadata || null,
    privacyConfirmed: Boolean(overrides.privacyConfirmed),
    savedLocally: true,
    remoteSubmit: "disabled",
    automaticUpload: false
  };
}

export function validateFeedbackDraft(draft) {
  const errors = [];
  if (!draft.description || draft.description.trim().length < 8) errors.push("description required");
  if (!draft.privacyConfirmed) errors.push("privacy confirmation required");
  if (draft.remoteSubmit !== "disabled") errors.push("remote submit must stay disabled");
  if (draft.automaticUpload !== false) errors.push("automatic upload must be false");
  return { valid: errors.length === 0, errors };
}

export function createUpdaterState(overrides = {}) {
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    enabled: false,
    channel: overrides.channel || "beta",
    currentVersion: overrides.currentVersion || "1.0.0-beta.9",
    availableVersion: overrides.availableVersion || null,
    provider: overrides.provider || "mock-unavailable",
    check: "manual-contract-only",
    download: "disabled",
    install: "disabled",
    progress: 0,
    cancellable: true,
    signatureRequired: true,
    checksumRequired: true,
    rollbackMetadata: overrides.rollbackMetadata || null,
    offline: Boolean(overrides.offline),
    userConfirmationRequired: true,
    updateServerConfigured: false
  };
}

export function createLocalizationState(locale = "en") {
  const supported = ["ar", "en", "de"];
  const selected = supported.includes(locale) ? locale : "en";
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    locale: selected,
    direction: selected === "ar" ? "rtl" : "ltr",
    supported,
    fallbackLocale: "en",
    completeTranslation: false,
    missingTranslationWarning: true,
    formatters: ["number", "date", "currency", "plural"]
  };
}

export function createKnownIssues() {
  return [
    {
      id: "UAOS-KI-001",
      title: "Windows installer is unsigned",
      area: "installer",
      severity: "high",
      status: "open",
      affectedVersion: "1.0.0-beta.9",
      workaround: "Use local development build until signing certificate is available.",
      manualVerification: true,
      externalBlocker: true,
      codeBlocker: false,
      owner: "release",
      sourceReport: "UAOS_WINDOWS_PACKAGE_READINESS",
      resolvedVersion: null,
      visibility: "public"
    },
    {
      id: "UAOS-KI-002",
      title: "Physical hardware validation is not complete",
      area: "hardware",
      severity: "medium",
      status: "open",
      affectedVersion: "1.0.0-beta.9",
      workaround: "Use mock profiles and validate manually before performance use.",
      manualVerification: true,
      externalBlocker: true,
      codeBlocker: false,
      owner: "qa",
      sourceReport: "UAOS_HARDWARE_READINESS",
      resolvedVersion: null,
      visibility: "public"
    }
  ];
}

export function createBetaChecklist() {
  const codePassed = ["frontend", "accounts", "offline mode", "sampler", "arranger", "AI", "DAW", "recovery", "diagnostics", "feedback", "pricing", "billing disabled", "cloud disabled", "Arabic foundation", "English foundation", "German foundation"];
  const manualRequired = ["manual hardware", "manual audio", "manual MIDI", "Windows signing", "external services", "deployment authorization", "legal approval"];
  return [
    ...codePassed.map((name) => ({ name, status: "PASS_CODE" })),
    ...manualRequired.map((name) => ({ name, status: "REQUIRED_MANUAL_OR_EXTERNAL" }))
  ];
}

export function evaluateReleaseGateV2(evidence = {}) {
  const checks = {
    tests: evidence.tests === true,
    staticCheck: evidence.staticCheck === true,
    build: evidence.build === true,
    runtimeCheck: evidence.runtimeCheck === true,
    desktopSmoke: evidence.desktopSmoke === true,
    routeSmoke: evidence.routeSmoke === true,
    e2eWorkflows: evidence.e2eWorkflows === true,
    accessibilityBaseline: evidence.accessibilityBaseline === true,
    performanceBudget: evidence.performanceBudget === true,
    arabicEncoding: evidence.arabicEncoding === true,
    branding: evidence.branding === true,
    pricing: evidence.pricing === true,
    accountOfflineFallback: evidence.accountOfflineFallback === true,
    stripeDisabled: evidence.stripeDisabled === true,
    cloudDisabled: evidence.cloudDisabled === true,
    updaterDisabled: evidence.updaterDisabled === true,
    installerPackageReadiness: evidence.installerPackageReadiness === true,
    signedInstaller: evidence.signedInstaller === true,
    legalApproval: evidence.legalApproval === true,
    physicalHardwareValidation: evidence.physicalHardwareValidation === true,
    manualAudioValidation: evidence.manualAudioValidation === true,
    manualMidiValidation: evidence.manualMidiValidation === true,
    productionServices: evidence.productionServices === true,
    externalApprovals: evidence.externalApprovals === true
  };
  const codeReady = Object.entries(checks)
    .filter(([name]) => !["signedInstaller", "legalApproval", "physicalHardwareValidation", "manualAudioValidation", "manualMidiValidation", "productionServices", "externalApprovals"].includes(name))
    .every(([, value]) => value);
  let status = "CODE_BLOCKED";
  if (codeReady) status = "RELEASE_CANDIDATE_READY_UNSIGNED";
  if (codeReady && checks.signedInstaller && checks.externalApprovals && checks.legalApproval) status = "RELEASE_CANDIDATE_READY_SIGNED";
  if (Object.values(checks).every(Boolean)) status = "PRODUCTION_READY";
  return { schemaVersion: PHASE9_SCHEMA_VERSION, generatedAt: new Date().toISOString(), status, codeReady, checks };
}

export function createPhase9State(overrides = {}) {
  return {
    schemaVersion: PHASE9_SCHEMA_VERSION,
    release: createReleaseCandidateMetadata(overrides.release),
    flags: normalizeFeatureFlags(overrides.flags?.values || overrides.flags || {}),
    onboarding: createOnboardingState(overrides.onboarding),
    demoProject: createSyntheticDemoProject(),
    recovery: createRecoveryState(overrides.recovery),
    updater: createUpdaterState(overrides.updater),
    localization: createLocalizationState(overrides.localization?.locale || overrides.locale),
    limits: BETA_LIMITS,
    shortcuts: { ...DEFAULT_SHORTCUTS, ...(overrides.shortcuts || {}) }
  };
}

export function migratePhase9State(value) {
  const next = createPhase9State(value || {});
  if (value?.onboarding) next.onboarding = createOnboardingState(value.onboarding);
  if (value?.flags) next.flags = normalizeFeatureFlags(value.flags.values || value.flags);
  if (value?.recovery) next.recovery = createRecoveryState(value.recovery);
  if (value?.updater) next.updater = createUpdaterState(value.updater);
  return next;
}
