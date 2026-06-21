import { createUaosSafeBinaryContainer, inspectUaosSafeBinaryContainer, validateUaosSafeBinaryContainer } from "./uaosBinaryExporterFoundation.js";
import { createHardwareAdapterPlan, validateHardwareAdapterPlan } from "../adapters/uaosHardwareAdapterFoundation.js";

export const UAOS_PHASE42_VERSION = "42.0.0";

export function createBinaryAdapterExport(input = {}) {
  const deviceProfileId = input.deviceProfileId || "korg_pa3x_oriental";
  const packageManifest = input.packageManifest || {
    format: "UAOS_HARDWARE_EXPORT_PACKAGE",
    projectName: "UAOS Phase 42 Binary Adapter Export",
    target: "korg",
    styleMap: {
      tempo: 96,
      sections: [
        { id: "intro1", bars: 4 },
        { id: "mainA", bars: 8 },
        { id: "fill1", bars: 1 },
        { id: "ending1", bars: 4 }
      ],
      tracks: [
        { id: "drums", channel: 10 },
        { id: "bass", channel: 2 },
        { id: "chords", channel: 3 }
      ]
    }
  };

  const adapterPlan = createHardwareAdapterPlan(deviceProfileId, packageManifest);
  const validPlan = validateHardwareAdapterPlan(adapterPlan);
  if (!validPlan.ok) {
    throw new Error(`Adapter plan invalid: ${validPlan.errors.join(", ")}`);
  }

  const binaryPayload = {
    format: "UAOS_BINARY_ADAPTER_EXPORT",
    version: UAOS_PHASE42_VERSION,
    deviceProfileId,
    packageManifest,
    adapterPlan,
    safety: {
      realBinaryExportReady: false,
      proprietaryKeyboardBinary: false,
      warning: "SAFE UAOS BINARY CONTAINER WITH ADAPTER PLAN - NOT .STY/.SET/.PRS"
    }
  };

  const bytes = createUaosSafeBinaryContainer({
    target: adapterPlan.brand.toLowerCase(),
    projectName: packageManifest.projectName || "UAOS Phase 42 Binary Adapter Export",
    format: "UAOS_BINARY_ADAPTER_EXPORT",
    styleMap: binaryPayload
  });

  return {
    format: "UAOS_PHASE42_BINARY_ADAPTER_RESULT",
    version: UAOS_PHASE42_VERSION,
    deviceProfileId,
    adapterPlan,
    bytes,
    byteLength: bytes.length,
    realBinaryExportReady: false
  };
}

export function inspectBinaryAdapterExport(result) {
  if (!result?.bytes) throw new Error("Missing bytes.");
  const info = inspectUaosSafeBinaryContainer(result.bytes);

  return {
    resultFormat: result.format,
    deviceProfileId: result.deviceProfileId,
    byteLength: result.byteLength,
    binaryMagic: info.magic,
    binaryTarget: info.target,
    binaryPayloadFormat: info.payload.format,
    realBinaryExportReady: false
  };
}

export function validateBinaryAdapterExport(result) {
  const errors = [];

  if (result?.format !== "UAOS_PHASE42_BINARY_ADAPTER_RESULT") errors.push("Invalid result format.");
  if (!result?.deviceProfileId) errors.push("Missing device profile id.");
  if (!result?.adapterPlan) errors.push("Missing adapter plan.");
  if (!(result?.bytes instanceof Uint8Array)) errors.push("Missing binary bytes.");
  if (result?.realBinaryExportReady !== false) errors.push("Must not claim real binary export ready.");

  if (result?.adapterPlan) {
    const plan = validateHardwareAdapterPlan(result.adapterPlan);
    if (!plan.ok) errors.push(...plan.errors);
  }

  if (result?.bytes instanceof Uint8Array) {
    const binary = validateUaosSafeBinaryContainer(result.bytes);
    if (!binary.ok) errors.push(...binary.errors);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
