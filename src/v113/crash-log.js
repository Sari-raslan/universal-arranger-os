const SECRET_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "secret",
]);

export function sanitizeCrashValue(value, depth = 0) {
  if (depth > 6) return "[max-depth]";

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeCrashValue(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const output = {};

    for (const [key, item] of Object.entries(value)) {
      output[key] = SECRET_KEYS.has(key)
        ? "[redacted]"
        : sanitizeCrashValue(item, depth + 1);
    }

    return output;
  }

  if (typeof value === "string") {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
      .replace(/[A-Za-z]:\\Users\\[^\\\s]+/gi, "[user-home]");
  }

  return value;
}

export function createCrashRecord(error, context = {}) {
  return Object.freeze({
    timestamp: new Date().toISOString(),
    name: error?.name ?? "Error",
    message: String(error?.message ?? error ?? "Unknown error"),
    stack: typeof error?.stack === "string" ? sanitizeCrashValue(error.stack) : null,
    context: sanitizeCrashValue(context),
  });
}