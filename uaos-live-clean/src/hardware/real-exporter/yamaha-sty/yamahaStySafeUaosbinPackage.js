import fs from "node:fs";
import { createYamahaStySafeExportPackage, validateYamahaStySafeExportPackage } from "./yamahaStySafeExportPackage.js";

export const UAOS_PHASE62_VERSION = "62.0.0";
export const UAOSBIN_MAGIC = "UAOSBIN1";

function stringToBytes(text) {
  return Array.from(Buffer.from(text, "utf8"));
}

function u32be(value) {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ];
}

export function createYamahaStySafeUaosbinPackage(input = {}) {
  const pkg = input.package || createYamahaStySafeExportPackage();
  const valid = validateYamahaStySafeExportPackage(pkg);

  if (!valid.ok) {
    throw new Error(valid.errors.join(", "));
  }

  if (
    pkg.realStyWriterReady === true ||
    pkg.realKeyboardBinaryWriteAllowed === true ||
    pkg.allowRealStyOutput === true ||
    pkg.finalDecision?.canExportRealSty === true
  ) {
    throw new Error("Unsafe Yamaha STY permission found before UAOSBIN creation.");
  }

  const payload = {
    format: "UAOS_YAMAHA_STY_SAFE_UAOSBIN_PAYLOAD",
    version: UAOS_PHASE62_VERSION,
    target: "yamaha",
    futureFormat: ".STY",
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    allowRealStyOutput: false,
    package: pkg,
    safety: {
      realBinaryBlocked: true,
      warning: "This UAOSBIN contains only a safe JSON package. It is not a Yamaha STY binary."
    }
  };

  const json = JSON.stringify(payload, null, 2);
  const payloadBytes = stringToBytes(json);
  const headerBytes = stringToBytes(UAOSBIN_MAGIC);
  const lengthBytes = u32be(payloadBytes.length);

  const bytes = new Uint8Array([...headerBytes, ...lengthBytes, ...payloadBytes]);

  return {
    format: "UAOS_YAMAHA_STY_SAFE_UAOSBIN_PACKAGE",
    version: UAOS_PHASE62_VERSION,
    phase: 62,
    target: "yamaha",
    futureFormat: ".STY",
    fileName: "UAOS_YAMAHA_STY_SAFE_PACKAGE.uaosbin",
    mimeType: "application/octet-stream",
    magic: UAOSBIN_MAGIC,
    payloadLength: payloadBytes.length,
    byteLength: bytes.length,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    allowRealStyOutput: false,
    allowUaosbinOutput: true,
    bytesBase64: Buffer.from(bytes).toString("base64"),
    payload,
    safety: {
      realBinaryBlocked: true,
      warning: "Safe UAOSBIN only. No real Yamaha STY file is generated."
    }
  };
}

export function validateYamahaStySafeUaosbinPackage(container) {
  const errors = [];

  if (container?.format !== "UAOS_YAMAHA_STY_SAFE_UAOSBIN_PACKAGE") errors.push("Invalid UAOSBIN package format.");
  if (container?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (container?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (container?.magic !== UAOSBIN_MAGIC) errors.push("Invalid UAOSBIN magic.");
  if (!container?.bytesBase64) errors.push("Missing base64 bytes.");
  if (container?.realStyWriterReady !== false) errors.push("Must not claim real STY writer ready.");
  if (container?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (container?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (container?.allowUaosbinOutput !== true) errors.push("UAOSBIN output should be allowed.");
  if (container?.payload?.safety?.realBinaryBlocked !== true) errors.push("Payload safety must block real binary.");
  if (container?.safety?.realBinaryBlocked !== true) errors.push("Container safety must block real binary.");

  return { ok: errors.length === 0, errors };
}

export function writeYamahaStySafeUaosbinPackage(outFile) {
  const container = createYamahaStySafeUaosbinPackage();
  const valid = validateYamahaStySafeUaosbinPackage(container);
  if (!valid.ok) throw new Error(valid.errors.join(", "));

  const bytes = Buffer.from(container.bytesBase64, "base64");
  fs.writeFileSync(outFile, bytes);

  return {
    file: outFile,
    byteLength: bytes.length,
    container
  };
}
