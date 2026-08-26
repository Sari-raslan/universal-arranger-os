/**
 * Gate-reduction internal modules — content / legal / format / hardware prep.
 * Fail-closed on proprietary WRITE, payment, legal acceptance, hardware write.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function publicDomainSourceDiscovery(catalog = []) {
  const rows = (catalog.length ? catalog : [
    { id: "pd-meta-1", title: "Synthetic public-domain metadata stub", license: "CC0-1.0", audioCopied: false }
  ]).map((r) => ({
    ...r,
    ok: Boolean(r.id && r.license && r.audioCopied === false),
    musicalQualityClaim: false
  }));
  return {
    schema: "uaos.content.public-domain-discovery/v1",
    ok: rows.every((r) => r.ok),
    rows,
    commercialContentCopied: false
  };
}

export function publicDomainContentPipeline(entries) {
  const list = entries || [
    { id: "syn-1", rights: "UAOS_SYNTHETIC", kind: "metadata" },
    { id: "bad-1", rights: "UNVERIFIED_COMMERCIAL", kind: "audio" }
  ];
  const accepted = [];
  const rejected = [];
  for (const e of list) {
    if (e.rights === "UAOS_SYNTHETIC" || e.rights === "CC0-1.0" || e.rights === "PUBLIC_DOMAIN") {
      accepted.push({ ...e, audioCopied: false });
    } else {
      rejected.push({ id: e.id, errorCode: "CONTENT_RIGHTS_REQUIRED" });
    }
  }
  return { schema: "uaos.content.public-domain-pipeline/v1", ok: rejected.length >= 1 && accepted.length >= 1, accepted, rejected };
}

export function syntheticContentPack({ audience = "kids" } = {}) {
  return {
    schema: "uaos.content.synthetic-pack/v1",
    ok: true,
    audience,
    lessons: [
      { id: `${audience}-lesson-1`, title: "Clap the pulse", media: "SYNTHETIC_TONE", uncleared: false }
    ],
    unclearedShippedAssets: 0,
    musicalQualityClaim: false
  };
}

export function metadataAssetPipeline(instrument) {
  return {
    schema: "uaos.content.metadata-asset-pipeline/v1",
    ok: true,
    instrument,
    mode: "METADATA_ONLY",
    sampleAudioCopied: false,
    entries: [{ id: `${instrument}-meta-1`, rights: "UAOS_SYNTHETIC", audio: null }],
    blockedCommercialImport: true
  };
}

export function legalDocumentLoader({ id, version, body }) {
  if (!id || !version || !body) return { ok: false, errorCode: "DOC_REQUIRED" };
  const sha256 = crypto.createHash("sha256").update(String(body)).digest("hex");
  return {
    schema: "uaos.legal.document-loader/v1",
    ok: true,
    id,
    version,
    sha256,
    accepted: false,
    legalAcceptance: false,
    professionalReviewComplete: false
  };
}

export function consentStateMachine() {
  const states = ["UNSEEN", "SHOWN", "DEFERRED", "ACCEPTED", "WITHDRAWN"];
  let state = "UNSEEN";
  return {
    schema: "uaos.legal.consent-state-machine/v1",
    states,
    getState: () => state,
    show: () => {
      state = "SHOWN";
      return state;
    },
    defer: () => {
      state = "DEFERRED";
      return state;
    },
    /** Does NOT claim legal acceptance complete for the product. */
    recordLocalAccept: () => {
      state = "ACCEPTED";
      return { state, legalAcceptanceComplete: false };
    },
    withdraw: () => {
      state = "WITHDRAWN";
      return state;
    },
    ok: true
  };
}

export function privacyRetentionConfig() {
  return {
    schema: "uaos.legal.privacy-retention/v1",
    ok: true,
    retentionDaysDefault: 30,
    exportEnabled: true,
    deleteEnabled: true,
    cloudSyncDefault: false,
    legalAcceptance: false
  };
}

export function permissiveLicenseVerify(entry) {
  const allowed = new Set(["CC0-1.0", "CC-BY-4.0", "MIT", "Apache-2.0", "PUBLIC_DOMAIN", "UAOS_SYNTHETIC"]);
  if (!entry?.license) return { ok: false, errorCode: "LICENSE_MISSING" };
  if (!allowed.has(entry.license)) return { ok: false, errorCode: "LICENSE_NOT_PERMISSIVE", license: entry.license };
  return { ok: true, license: entry.license, commercialReuseClaim: false };
}

export function attributionRecord({ title, license, author = "Unknown" }) {
  if (!title || !license) return { ok: false, errorCode: "ATTRIBUTION_INCOMPLETE" };
  return {
    ok: true,
    text: `${title} — ${author} — ${license}`,
    schema: "uaos.legal.attribution/v1"
  };
}

export function legalContentLedger(entries = []) {
  const ledger = entries.map((e) => ({
    id: e.id,
    license: e.license,
    sha256: crypto.createHash("sha256").update(JSON.stringify(e)).digest("hex")
  }));
  return { schema: "uaos.legal.content-ledger/v1", ok: true, count: ledger.length, ledger, legalAcceptance: false };
}

export function vatHandlingConfig({ country = "DE", rateBps = 1900 } = {}) {
  return {
    schema: "uaos.commercial.vat-config/v1",
    ok: true,
    country,
    rateBps,
    paymentActivation: false,
    commerceLive: false
  };
}

export function contributorPipelineIntake(form) {
  if (!form?.email || !form?.rightsDeclaration) {
    return { ok: false, errorCode: "INTAKE_INCOMPLETE" };
  }
  return {
    schema: "uaos.library.contributor-intake/v1",
    ok: true,
    status: "RECEIVED_NOT_LEGALLY_ACCEPTED",
    legalAcceptance: false,
    id: crypto.createHash("sha256").update(form.email).digest("hex").slice(0, 12)
  };
}

export function formatInspectionPrep(family, buffer = Buffer.from(family.toUpperCase())) {
  const families = ["yamaha", "roland", "ketron", "korg", "unknown"];
  const f = String(family || "unknown").toLowerCase();
  return {
    schema: "uaos.format.inspection-prep/v1",
    ok: families.includes(f),
    family: f,
    level: "INSPECT_ONLY",
    write: "FORMAT_CONTRACT_REQUIRED",
    hexPreview: Buffer.from(buffer).subarray(0, 32).toString("hex"),
    proprietaryWrite: false
  };
}

export function writerAdapterFailClosed(family) {
  return {
    schema: "uaos.format.writer-adapter/v1",
    ok: true,
    family,
    writeAttempted: false,
    writeAllowed: false,
    errorCode: "FORMAT_CONTRACT_REQUIRED",
    support: "FORMAT_CONTRACT_REQUIRED"
  };
}

export function realtimeDspStub() {
  return {
    schema: "uaos.studio.realtime-dsp-stub/v1",
    ok: true,
    realtimeDsp: false,
    implemented: false,
    offlineRenderAvailable: true,
    support: "NOT_SUPPORTED",
    musicalQualityClaim: false
  };
}

export function mockUsbTransport() {
  const devices = [{ id: "mock-usb-midi-1", name: "UAOS Mock MIDI", connected: true }];
  return {
    schema: "uaos.hardware.mock-usb-transport/v1",
    ok: true,
    devices,
    writeGuard: true,
    hardwareWrite: false,
    disconnect: () => ({ ok: true, connected: false }),
    reconnect: () => ({ ok: true, connected: true })
  };
}

export function mockAudioDeviceManager() {
  return {
    schema: "uaos.hardware.mock-audio-devices/v1",
    ok: true,
    devices: [
      { id: "mock-out", type: "output", name: "UAOS Mock Output" },
      { id: "mock-in", type: "input", name: "UAOS Mock Input" }
    ],
    asio: { available: false, reason: "HARDWARE_REQUIRED" },
    hardwareWrite: false
  };
}

export function mockRecordingHarness() {
  const fixture = Buffer.alloc(4800, 0);
  return {
    schema: "uaos.hardware.mock-recording/v1",
    ok: true,
    bytes: fixture.length,
    source: "SYNTHETIC_SILENCE_FIXTURE",
    hardwareCapture: false,
    hardwareWrite: false
  };
}

export function parentGateMechanics({ pin = "0000" } = {}) {
  let unlocked = false;
  return {
    schema: "uaos.singy.parent-gate/v1",
    ok: true,
    unlock: (attempt) => {
      unlocked = String(attempt) === String(pin);
      return { unlocked, ownerAdoptionApproved: false };
    },
    isUnlocked: () => unlocked,
    ownerAdoptionApproved: false
  };
}

export function offlineCloudAdapterStub() {
  return {
    schema: "uaos.singy.cloud-adapter-stub/v1",
    ok: true,
    cloudEnabled: false,
    mode: "OFFLINE_ONLY",
    ownerApprovalRequired: true
  };
}

export function voiceToMelodySoftwarePath(pitches = [60, 62, 64]) {
  return {
    schema: "uaos.creator.voice-to-melody-software/v1",
    ok: Array.isArray(pitches) && pitches.length > 0,
    pitches,
    micCapture: "HARDWARE_REQUIRED",
    hardwareVerified: false,
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false
  };
}

export function guidedMusicProjectTemplate() {
  return {
    schema: "uaos.singy.guided-project/v1",
    ok: true,
    steps: ["choose-key", "add-melody", "export-midi"],
    offline: true,
    ownerAdoptionApproved: false,
    musicalQualityClaim: false
  };
}

export function kidsTeenPageContract(kind) {
  return {
    schema: "uaos.website.age-page-contract/v1",
    ok: kind === "kids" || kind === "teen",
    kind,
    route: kind === "kids" ? "/products/singy/?mode=kids" : "/products/singy/?mode=teen",
    productionDeploy: false,
    ownerAdoptionApproved: false
  };
}

export function runGateReductionSuite() {
  const checks = [
    publicDomainSourceDiscovery().ok,
    publicDomainContentPipeline().ok,
    syntheticContentPack().ok,
    metadataAssetPipeline("oud").ok,
    legalDocumentLoader({ id: "eula", version: "draft-1", body: "DRAFT ONLY — NOT ACCEPTED" }).ok,
    consentStateMachine().ok,
    privacyRetentionConfig().ok,
    permissiveLicenseVerify({ license: "CC0-1.0" }).ok,
    attributionRecord({ title: "Stub", license: "CC0-1.0" }).ok,
    legalContentLedger([{ id: "1", license: "CC0-1.0" }]).ok,
    vatHandlingConfig().ok,
    contributorPipelineIntake({ email: "a@b.c", rightsDeclaration: "synthetic" }).ok,
    formatInspectionPrep("yamaha").ok,
    writerAdapterFailClosed("korg").writeAllowed === false,
    realtimeDspStub().realtimeDsp === false,
    mockUsbTransport().ok,
    mockAudioDeviceManager().ok,
    mockRecordingHarness().ok,
    parentGateMechanics().unlock("0000").unlocked,
    offlineCloudAdapterStub().cloudEnabled === false,
    voiceToMelodySoftwarePath().ok,
    guidedMusicProjectTemplate().ok,
    kidsTeenPageContract("kids").ok
  ];
  return { ok: checks.every(Boolean), passed: checks.filter(Boolean).length, total: checks.length };
}
