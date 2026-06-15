import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function normalizePassword(password) {
  const value = String(password || "");

  if (value.length < 12) {
    throw new Error("Password must contain at least 12 characters.");
  }

  if (Buffer.byteLength(value, "utf8") > 256) {
    throw new Error("Password is too long.");
  }

  return value;
}

export async function hashPassword(password) {
  const normalized = normalizePassword(password);
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(normalized, salt, KEY_LENGTH);

  return [
    "scrypt",
    salt.toString("base64url"),
    Buffer.from(derived).toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password, encoded) {
  const parts = String(encoded || "").split("$");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  let normalized;

  try {
    normalized = normalizePassword(password);
  } catch {
    return false;
  }

  const salt = Buffer.from(parts[1], "base64url");
  const expected = Buffer.from(parts[2], "base64url");
  const actual = Buffer.from(
    await scrypt(normalized, salt, expected.length),
  );

  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}