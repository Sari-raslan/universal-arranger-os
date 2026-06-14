export const CLOUD_SCHEMA_VERSION = 1;

export function createCloudState(overrides = {}) {
  return {
    schemaVersion: CLOUD_SCHEMA_VERSION,
    accountId: null,
    remoteProjectId: null,
    revision: 1,
    contentHash: null,
    sync: {
      enabled: false,
      status: "disabled",
      lastSync: null,
      conflictState: "disabled",
      offline: true,
      userConsent: false,
      rawAudioUpload: false,
      commercialLibraryUpload: false,
    },
    entitlements: {
      plan: "free",
      features: ["basic-singing", "limited-local-projects", "demo-export-metadata"],
      cloudSync: false,
      daw: false,
      proArranger: false,
    },
    privacy: {
      analytics: false,
      cloudSync: false,
      aiRemoteProvider: false,
      marketing: false,
      noAdvertiserSharing: true,
      minimalDataCollection: true,
    },
    projects: [],
    ...overrides,
  };
}

export function migrateCloudState(value) {
  const base = createCloudState();
  const source = value && typeof value === "object" ? value : {};
  return {
    ...base,
    ...source,
    schemaVersion: CLOUD_SCHEMA_VERSION,
    sync: { ...base.sync, ...(source.sync || {}), rawAudioUpload: false, commercialLibraryUpload: false },
    entitlements: { ...base.entitlements, ...(source.entitlements || {}) },
    privacy: { ...base.privacy, ...(source.privacy || {}), noAdvertiserSharing: true, minimalDataCollection: true },
    projects: Array.isArray(source.projects) ? source.projects : [],
  };
}

export function cloudProjectFromDaw(dawProject, cloud = createCloudState()) {
  return {
    localProjectId: dawProject?.id || "local-project",
    remoteProjectId: cloud.remoteProjectId || null,
    name: dawProject?.name || "UAOS Local Project",
    localRevision: cloud.revision || 1,
    remoteRevision: 0,
    baseRevision: cloud.revision || 1,
    contentHash: cloud.contentHash || null,
    syncStatus: cloud.sync.enabled ? "queued" : "disabled",
    conflictState: cloud.sync.conflictState || "disabled",
    lastSync: cloud.sync.lastSync,
    missingAssets: dawProject?.missingAssets || [],
    localOnlyAssetReferences: (dawProject?.audioAssets || []).map((asset) => asset.id),
    rawAudioUpload: false,
  };
}
