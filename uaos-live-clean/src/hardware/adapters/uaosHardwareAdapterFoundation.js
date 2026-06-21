import { getUaosDeviceProfile } from "../profiles/uaosDeviceProfiles.js";

export const UAOS_PHASE38_VERSION = "38.0.0";

export function createHardwareAdapterPlan(deviceProfileId, packageManifest = {}) {
  const profile = getUaosDeviceProfile(deviceProfileId);

  return {
    format: "UAOS_HARDWARE_ADAPTER_PLAN",
    version: UAOS_PHASE38_VERSION,
    deviceProfileId,
    brand: profile.brand,
    model: profile.model,
    realBinaryReady: false,
    inputFormat: packageManifest.format || "UAOS_HARDWARE_EXPORT_PACKAGE",
    outputMode: "safe-json-adapter-plan",
    futureFormats: profile.futureFormats,
    sectionMapping: profile.sections.map((section, index) => ({
      index,
      deviceSection: section,
      uaosSource: packageManifest?.styleMap?.sections?.[index]?.id || null
    })),
    channelMapping: profile.channels,
    warnings: [
      "This is an adapter foundation only.",
      "No proprietary binary file is generated.",
      "Real hardware export requires legal format validation and hardware roundtrip testing."
    ]
  };
}

export function validateHardwareAdapterPlan(plan) {
  const errors = [];
  if (plan?.format !== "UAOS_HARDWARE_ADAPTER_PLAN") errors.push("Invalid adapter plan format.");
  if (!plan?.deviceProfileId) errors.push("Missing device profile id.");
  if (plan?.realBinaryReady !== false) errors.push("Adapter must not claim real binary readiness.");
  if (!plan?.sectionMapping?.length) errors.push("Missing section mapping.");
  if (!plan?.channelMapping) errors.push("Missing channel mapping.");
  return { ok: errors.length === 0, errors };
}
