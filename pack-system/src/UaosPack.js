export function validateUaosPack(pack) {
  const required = ["packId", "format", "targetKeyboards"];
  const missing = required.filter(key => !pack?.[key]);
  return { ok: missing.length === 0, missing };
}

export function createUaosPackManifest(packId, name) {
  return {
    packId,
    name,
    format: ".uaos-pack",
    version: "0.1.0",
    targetKeyboards: ["korg-pa", "yamaha-genos", "roland-bk", "ketron"],
    licenseType: "original-or-licensed-only"
  };
}
