import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

function toBuffer(value) {
  return Buffer.from(String(value), "utf8");
}

export function createSecureToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url");
}

export function hmacHex(secret, payload) {
  if (!secret) {
    throw new Error("HMAC secret is required.");
  }

  return createHmac("sha256", secret)
    .update(String(payload), "utf8")
    .digest("hex");
}

export function safeEqualText(left, right) {
  const leftBuffer = toBuffer(left);
  const rightBuffer = toBuffer(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyHmacHex(secret, payload, signature) {
  if (!signature || !secret) {
    return false;
  }

  const expected = hmacHex(secret, payload);
  return safeEqualText(expected, String(signature).trim().toLowerCase());
}