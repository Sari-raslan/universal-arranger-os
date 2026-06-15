import { createSecureToken, hmacHex, safeEqualText } from "./crypto.mjs";
import { getPlan } from "./plans.mjs";

function encode(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decode(value) {
  return JSON.parse(
    Buffer.from(String(value), "base64url").toString("utf8"),
  );
}

export function createLicensePayload({
  subject,
  planId,
  deviceId,
  issuedAt = new Date(),
  expiresAt,
  licenseId = createSecureToken(18),
}) {
  if (!String(subject || "").trim()) {
    throw new Error("License subject is required.");
  }

  if (!String(deviceId || "").trim()) {
    throw new Error("Device ID is required.");
  }

  getPlan(planId);

  const issued = new Date(issuedAt);
  const expires = expiresAt
    ? new Date(expiresAt)
    : new Date(issued.getTime() + 35 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(issued.getTime()) || Number.isNaN(expires.getTime())) {
    throw new Error("License dates are invalid.");
  }

  if (expires <= issued) {
    throw new Error("License expiry must be after issue time.");
  }

  return {
    version: 1,
    licenseId,
    subject: String(subject),
    planId: String(planId),
    deviceId: String(deviceId),
    issuedAt: issued.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

export function issueLicense(input, secret) {
  const payload = createLicensePayload(input);
  const encoded = encode(payload);
  const signature = hmacHex(secret, encoded);

  return {
    token: `${encoded}.${signature}`,
    payload,
  };
}

export function verifyLicense(
  token,
  secret,
  {
    now = new Date(),
    deviceId = null,
  } = {},
) {
  const [encoded, signature, extra] = String(token || "").split(".");

  if (!encoded || !signature || extra) {
    return {
      valid: false,
      reason: "malformed-license",
      payload: null,
    };
  }

  const expected = hmacHex(secret, encoded);

  if (!safeEqualText(expected, signature)) {
    return {
      valid: false,
      reason: "invalid-signature",
      payload: null,
    };
  }

  let payload;

  try {
    payload = decode(encoded);
  } catch {
    return {
      valid: false,
      reason: "invalid-payload",
      payload: null,
    };
  }

  const expiresAt = new Date(payload.expiresAt);
  const checkedAt = new Date(now);

  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt <= checkedAt
  ) {
    return {
      valid: false,
      reason: "expired-license",
      payload,
    };
  }

  if (
    deviceId &&
    !safeEqualText(String(payload.deviceId), String(deviceId))
  ) {
    return {
      valid: false,
      reason: "device-mismatch",
      payload,
    };
  }

  return {
    valid: true,
    reason: "valid",
    payload,
  };
}