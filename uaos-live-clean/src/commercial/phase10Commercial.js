import { pricingPlans } from "../config/pricing.js";

export const PHASE10_SCHEMA_VERSION = 1;

export const PRODUCT_EDITIONS = Object.freeze([
  Object.freeze({
    productId: "sing",
    planId: "free",
    name: "UAOS Sing",
    workflow: "Simplified singer workflow",
    entitlement: "free",
    features: ["local-audio-input", "basic-analysis", "basic-melody-result", "local-save"],
    accountRequired: false,
    cloudRequired: false,
    status: "available"
  }),
  Object.freeze({
    productId: "studio",
    planId: "creator",
    name: "UAOS Studio",
    workflow: "DAW and creator studio",
    entitlement: "studio",
    features: ["daw", "sampler", "recording", "midi", "local-ai-analysis", "project-management"],
    accountRequired: false,
    cloudRequired: false,
    status: "release-candidate"
  }),
  Object.freeze({
    productId: "pro",
    planId: "professional",
    name: "UAOS Pro Arranger",
    workflow: "Professional arranger foundation",
    entitlement: "pro",
    features: ["arranger-engine", "hardware-profiles", "advanced-midi", "ai-arrangement-planning", "sampler-library-integration"],
    accountRequired: false,
    cloudRequired: false,
    status: "release-candidate"
  }),
  Object.freeze({
    productId: "ultimate",
    planId: "ultimate",
    name: "UAOS Ultimate / Performer",
    workflow: "Future performer edition",
    entitlement: "ultimate-planned",
    features: ["future-metadata-only"],
    accountRequired: false,
    cloudRequired: false,
    status: "planned-not-for-sale",
    commercialActivationEnabled: false
  })
]);

export function canonicalPricing() {
  return pricingPlans.map((plan) => ({
    productId: plan.id,
    planId: plan.backendPlanId,
    name: plan.name,
    currency: "EUR",
    introAmount: plan.launchPriceEur,
    regularAmount: plan.regularPriceEur,
    introPaidMonths: plan.launchMonths,
    checkoutEnabled: false,
    notForSale: plan.id === "ultimate",
    status: plan.id === "ultimate" ? "planned-not-for-sale" : plan.status,
    taxMode: "tax-not-configured",
    noHiddenCharge: true
  }));
}

export function getEdition(productId) {
  return PRODUCT_EDITIONS.find((edition) => edition.productId === productId || edition.planId === productId) || null;
}

export function createEntitlement(input = {}) {
  const edition = getEdition(input.productId || input.planId || "sing") || PRODUCT_EDITIONS[0];
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    productId: edition.productId,
    planId: edition.planId,
    accountId: input.accountId || null,
    localLicense: input.localLicense || { mode: "local-foundation", privateKeyEmbedded: false },
    subscription: input.subscription || { provider: "disabled", status: "not-configured" },
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    gracePeriodDays: input.gracePeriodDays ?? 14,
    offline: input.offline ?? true,
    cached: true,
    expired: Boolean(input.expired),
    disabled: Boolean(input.disabled),
    testMode: true,
    signatureVerification: "contract-required-no-private-key",
    serverVerification: "disabled-until-production-configured",
    destructiveLockout: false,
    localProjectsReadable: true,
    exportAccess: edition.productId === "sing" ? "metadata-and-basic-midi" : "metadata-midi-and-local-project",
    features: edition.features,
    valid: !input.disabled
  };
}

export function validateEntitlement(entitlement) {
  const errors = [];
  if (!entitlement || typeof entitlement !== "object") errors.push("entitlement required");
  if (entitlement?.localLicense?.privateKeyEmbedded) errors.push("private keys must not be embedded");
  if (entitlement?.destructiveLockout) errors.push("destructive lockout is not allowed");
  if (entitlement?.localProjectsReadable !== true) errors.push("local projects must remain readable");
  return { valid: errors.length === 0, errors };
}

export function createActivationState(input = {}) {
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    mode: input.mode || "local-only",
    signedIn: input.mode === "signed-in",
    activationCodeMetadata: input.activationCodeMetadata || null,
    subscriptionEntitlementMode: input.subscriptionEntitlementMode || "disabled-provider",
    deviceHash: input.deviceHash || "privacy-safe-local-device-hash-placeholder",
    maximumDevices: input.maximumDevices || 3,
    deactivateDeviceContract: "available-when-server-configured",
    offlineGraceDays: input.offlineGraceDays ?? 14,
    retryAvailable: true,
    server: input.server || "unavailable",
    invalidActivation: Boolean(input.invalidActivation),
    expiredActivation: Boolean(input.expiredActivation),
    commercialActivationEnabled: false,
    provider: "mock-disabled",
    networkRequestAutomatic: false
  };
}

export function calculateFoundersSchedule(startIso, planId) {
  const plan = canonicalPricing().find((item) => item.productId === planId || item.planId === planId);
  if (!plan || plan.notForSale) throw new RangeError(`No founders checkout schedule for ${planId}`);
  const start = new Date(`${startIso}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) throw new RangeError("Invalid founders schedule start date");
  const month = (offset) => new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, start.getUTCDate())).toISOString().slice(0, 10);
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    planId: plan.productId,
    currency: "EUR",
    tax: { configured: false, included: false, excluded: true },
    noHiddenCharge: true,
    realSubscriptionCreated: false,
    phases: [
      { paidMonth: 1, startsOn: month(0), amount: plan.introAmount, type: "founders-intro" },
      { paidMonth: 2, startsOn: month(1), amount: plan.introAmount, type: "founders-intro" },
      { paidMonth: 3, startsOn: month(2), amount: plan.introAmount, type: "founders-intro" },
      { paidMonth: 4, startsOn: month(3), amount: plan.regularAmount, type: "regular-renewal" }
    ],
    pausedSubscription: "metadata-only",
    cancelledSubscription: "metadata-only",
    retry: "metadata-only"
  };
}

export function createDownloadCenter(input = {}) {
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    version: input.version || "1.0.0-beta.10",
    buildNumber: input.buildNumber || "local-phase10",
    channel: "release-candidate",
    windowsInstaller: { status: "unsigned-code-ready", signed: false, checksum: input.windowsChecksum || null },
    portableBuild: { status: "metadata-ready", checksum: null },
    android: { status: "code-readiness-only" },
    ios: { status: "metadata-only-unsupported-on-windows" },
    webApp: { status: "local-ready", url: "http://127.0.0.1:5173" },
    knownIssues: ["unsigned-installer", "manual-hardware-validation-required"],
    minimumRequirements: ["Windows 10 19045", "Modern Chromium browser", "Web Audio capable device"],
    fakeDownloadLinks: false
  };
}

export function createAndroidReadiness() {
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    packageId: "app.uaos.mobile",
    applicationName: "UAOS",
    icons: "metadata-required",
    splash: "metadata-required",
    sdkValidation: "not-run-on-this-host",
    javaCompatibility: "requires-local-android-toolchain",
    gradleCompatibility: "requires-local-android-toolchain",
    permissions: ["RECORD_AUDIO optional"],
    midiCapability: "metadata-only",
    fileAccessPolicy: "scoped-storage-required",
    networkSecurity: "no-cleartext-production",
    offlineFunctionality: true,
    debugApkReady: false,
    releaseSigningMissing: true,
    embeddedSecrets: false,
    playStoreReady: false
  };
}

export function createIosReadiness() {
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    bundleId: "app.uaos.mobile",
    capabilities: ["audio", "files", "midi-metadata"],
    microphonePermissionText: "UAOS can analyze local audio when you choose to record.",
    fileAccessPolicy: "user-selected-files",
    offlineMode: true,
    privacyManifest: "foundation-required",
    signingRequired: true,
    provisioningRequired: true,
    appStoreRequirements: "not-complete",
    buildStatusOnWindows: "unsupported",
    fakeSuccessfulBuild: false
  };
}

export function createUpdatePolicy(input = {}) {
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    enabled: false,
    updateServerConfigured: false,
    channel: input.channel || "release-candidate",
    currentVersion: input.currentVersion || "1.0.0-beta.10",
    availableVersion: input.availableVersion || null,
    versionComparison: input.availableVersion ? "metadata-only" : "no-update",
    checksumRequired: true,
    signatureRequired: true,
    explicitUserConfirmation: true,
    automaticInstall: false,
    cancellation: true,
    rollbackMetadata: input.rollbackMetadata || null,
    provider: "mock-disabled",
    insecureHttpAllowed: false,
    unsignedProductionUpdateAccepted: false
  };
}

export function createTelemetryState(input = {}) {
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    enabled: false,
    consentRequired: true,
    provider: "local-memory-disabled",
    externalTracking: false,
    rawAudio: false,
    midiContent: false,
    projectContent: false,
    emailIncluded: false,
    anonymizedEventMetadata: true,
    categories: ["product-usage", "crash-metadata", "performance-budget"],
    optOut: true,
    consentWithdrawn: input.consentWithdrawn ?? true,
    retentionDays: 30,
    providerUnavailable: true
  };
}

export function createCrashReport(input = {}) {
  const scrub = (value) => String(value || "").replace(/(password|token|cookie|secret)=([^;\s]+)/gi, "$1=[redacted]").slice(0, 2000);
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    id: input.id || `crash-${Date.now()}`,
    appVersion: input.appVersion || "1.0.0-beta.10",
    platform: input.platform || "browser",
    route: input.route || "unknown",
    activeFeatures: input.activeFeatures || [],
    sanitizedStack: scrub(input.stack),
    passwordsIncluded: false,
    tokensIncluded: false,
    cookiesIncluded: false,
    rawAudioIncluded: false,
    projectContentIncluded: false,
    uploadConsent: Boolean(input.uploadConsent),
    remoteUpload: "disabled",
    exportAvailable: true,
    recoveryLink: "#/demo",
    retrySafeState: true
  };
}

export function createBackupManifest(input = {}) {
  const files = Array.isArray(input.files) ? input.files : [];
  const rejected = files.filter((file) => /\.\.|[\\/]|\.dll$/i.test(String(file.path || file)));
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    id: input.id || `backup-${Date.now()}`,
    includes: ["project-metadata", "presets", "midi-mappings", "device-profiles", "user-preferences", "recovery-snapshots"],
    exportZipContract: "metadata-only-no-executable-restore",
    checksum: input.checksum || "pending",
    files,
    rejected,
    restoreValidation: rejected.length === 0,
    schemaMigration: "required-on-restore",
    conflictWarning: true,
    executableRestore: false,
    dllAllowed: false,
    pathTraversalAllowed: false,
    commercialSampleRedistribution: false,
    missingAssetReport: input.missingAssets || []
  };
}

export function createReleaseNotes(input = {}) {
  return {
    schemaVersion: PHASE10_SCHEMA_VERSION,
    version: input.version || "1.0.0-beta.10",
    date: input.date || new Date().toISOString().slice(0, 10),
    newFeatures: input.newFeatures || ["Commercial release foundation", "Licensing and activation metadata", "Final release gate"],
    improvements: input.improvements || ["Canonical pricing display", "Download center honesty", "Mobile readiness reports"],
    bugFixes: input.bugFixes || ["Removed stale homepage pricing"],
    knownIssues: input.knownIssues || ["Unsigned installer", "Manual validation required"],
    externalBlockers: ["signing", "legal", "privacy", "production services", "manual hardware/audio/MIDI"],
    hardwareStatus: "mock profiles code-ready, physical validation required",
    signingStatus: "unsigned",
    cloudStatus: "disabled-safe foundation",
    billingStatus: "disabled-safe foundation",
    privacyStatus: "summary only, legal review required",
    upgradeNotes: "Session v7 remains compatible through migration.",
    downgradeWarning: "Projects created with newer schemas may need export before older app versions.",
    migrationNotes: "No destructive migrations are executed."
  };
}

export function createFinalTestMatrix() {
  return [
    ["Web", "PASS_AUTOMATED"],
    ["Electron development", "PASS_AUTOMATED"],
    ["Electron packaged", "CODE_READY_MANUAL_CHECK_REQUIRED"],
    ["Windows unpacked", "CODE_READY_MANUAL_CHECK_REQUIRED"],
    ["Windows installer metadata", "PASS_CODE_UNSIGNED"],
    ["Android debug readiness", "CODE_ONLY_NOT_BUILT"],
    ["iOS readiness", "METADATA_ONLY_UNSUPPORTED_ON_WINDOWS"],
    ["Offline mode", "PASS_AUTOMATED"],
    ["Accounts online", "PASS_MOCK"],
    ["Accounts offline", "PASS_FALLBACK"],
    ["Stripe disabled", "PASS_AUTOMATED"],
    ["SMTP disabled", "PASS_AUTOMATED"],
    ["PostgreSQL disabled", "PASS_AUTOMATED"],
    ["Cloud sync disabled", "PASS_AUTOMATED"],
    ["Audio unavailable", "PASS_FALLBACK"],
    ["Microphone denied", "MANUAL_REQUIRED"],
    ["MIDI unavailable", "PASS_FALLBACK"],
    ["Mock MIDI", "PASS_AUTOMATED"],
    ["Mock hardware", "PASS_AUTOMATED"],
    ["Arabic", "FOUNDATION"],
    ["English", "FOUNDATION"],
    ["German", "FOUNDATION"],
    ["Reduced motion", "PASS_AUTOMATED"],
    ["Corrupted session", "PASS_AUTOMATED"],
    ["Missing assets", "PASS_WARNING"],
    ["Old session migration", "PASS_AUTOMATED"],
    ["Uninstall metadata", "FOUNDATION"]
  ].map(([area, status]) => ({ area, status }));
}

export function evaluateFinalReleaseGate(evidence = {}) {
  const checks = {
    automatedTests: evidence.automatedTests === true,
    staticChecks: evidence.staticChecks === true,
    builds: evidence.builds === true,
    routeSmoke: evidence.routeSmoke === true,
    e2e: evidence.e2e === true,
    accessibilityBaseline: evidence.accessibilityBaseline === true,
    performanceBudget: evidence.performanceBudget === true,
    securityBaseline: evidence.securityBaseline === true,
    pricingConsistency: evidence.pricingConsistency === true,
    installerReadiness: evidence.installerReadiness === true,
    mobileReadiness: evidence.mobileReadiness === true,
    updaterDisabled: evidence.updaterDisabled === true,
    signingCertificate: evidence.signingCertificate === true,
    legalApproval: evidence.legalApproval === true,
    privacyApproval: evidence.privacyApproval === true,
    productionPostgres: evidence.productionPostgres === true,
    productionStripe: evidence.productionStripe === true,
    productionSmtp: evidence.productionSmtp === true,
    domainTls: evidence.domainTls === true,
    physicalHardwareValidation: evidence.physicalHardwareValidation === true,
    manualAudioValidation: evidence.manualAudioValidation === true,
    manualMidiValidation: evidence.manualMidiValidation === true,
    manualRecordingValidation: evidence.manualRecordingValidation === true,
    releaseAuthorization: evidence.releaseAuthorization === true
  };
  const codeReady = Object.entries(checks)
    .filter(([key]) => !["signingCertificate", "legalApproval", "privacyApproval", "productionPostgres", "productionStripe", "productionSmtp", "domainTls", "physicalHardwareValidation", "manualAudioValidation", "manualMidiValidation", "manualRecordingValidation", "releaseAuthorization"].includes(key))
    .every(([, value]) => value);
  let status = "CODE_BLOCKED";
  if (codeReady) status = "RELEASE_CANDIDATE_READY_UNSIGNED";
  if (codeReady && checks.signingCertificate && checks.legalApproval && checks.privacyApproval) status = "RELEASE_CANDIDATE_READY_SIGNED";
  if (Object.values(checks).every(Boolean)) status = "PRODUCTION_READY";
  return { schemaVersion: PHASE10_SCHEMA_VERSION, generatedAt: new Date().toISOString(), status, codeReady, productionActivationReady: status === "PRODUCTION_READY", checks };
}
