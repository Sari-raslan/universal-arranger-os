import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token) {
  return createHash("sha256")
    .update(String(token || ""), "utf8")
    .digest("base64url");
}

export function safeTokenHashEqual(left, right) {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}