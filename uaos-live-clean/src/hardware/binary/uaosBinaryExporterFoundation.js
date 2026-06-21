export const UAOS_PHASE41_VERSION = "41.0.0";

export function stringToBytes(text) {
  return Array.from(new TextEncoder().encode(String(text)));
}

export function u32be(value) {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ];
}

export function createUaosSafeBinaryContainer(input = {}) {
  const target = input.target || "korg";
  const payload = JSON.stringify({
    format: input.format || "UAOS_HARDWARE_EXPORT_PACKAGE",
    target,
    projectName: input.projectName || "UAOS Phase 41 Binary Foundation",
    styleMap: input.styleMap || {},
    warning: "SAFE UAOS CONTAINER ONLY - NOT PROPRIETARY KEYBOARD BINARY"
  }, null, 2);

  const magic = stringToBytes("UAOSBIN1");
  const targetBytes = stringToBytes(target.padEnd(16, " ").slice(0, 16));
  const payloadBytes = stringToBytes(payload);
  const lengthBytes = u32be(payloadBytes.length);

  return new Uint8Array([
    ...magic,
    ...targetBytes,
    ...lengthBytes,
    ...payloadBytes
  ]);
}

export function inspectUaosSafeBinaryContainer(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const magic = new TextDecoder().decode(arr.slice(0, 8));
  const target = new TextDecoder().decode(arr.slice(8, 24)).trim();
  const len =
    (arr[24] << 24) |
    (arr[25] << 16) |
    (arr[26] << 8) |
    arr[27];

  const payload = new TextDecoder().decode(arr.slice(28, 28 + len));

  return {
    magic,
    target,
    payloadLength: len,
    totalLength: arr.length,
    payload: JSON.parse(payload)
  };
}

export function validateUaosSafeBinaryContainer(bytes) {
  const errors = [];
  try {
    const info = inspectUaosSafeBinaryContainer(bytes);
    if (info.magic !== "UAOSBIN1") errors.push("Invalid magic.");
    if (!info.target) errors.push("Missing target.");
    if (!info.payloadLength) errors.push("Missing payload.");
    if (info.payload.warning.indexOf("NOT PROPRIETARY") === -1) {
      errors.push("Missing safety warning.");
    }
  } catch (error) {
    errors.push(error.message);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
