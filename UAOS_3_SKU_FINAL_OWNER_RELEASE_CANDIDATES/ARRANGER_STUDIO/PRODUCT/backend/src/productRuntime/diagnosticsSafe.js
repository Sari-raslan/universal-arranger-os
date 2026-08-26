/**
 * Safe diagnostics export — redacts secrets and owner paths.
 */
import crypto from "node:crypto";
import os from "node:os";
import { platformInfo } from "./portManager.js";

const SENSITIVE_KEY = /pass(word)?|token|cookie|secret|authorization|api[_-]?key|private[_-]?key|credential/i;

export function redactValue(key, value) {
  if (SENSITIVE_KEY.test(String(key))) return "[REDACTED]";
  if (typeof value === "string") {
    return value
      .replace(/[A-Za-z]:\\Users\\[^\\/]+/gi, "[USER_HOME]")
      .replace(/\/Users\/[^/]+/g, "[USER_HOME]")
      .replace(/\\Users\\[^\\/]+/gi, "[USER_HOME]");
  }
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    const out = Array.isArray(value) ? [] : {};
    for (const [k, v] of Object.entries(value)) out[k] = redactValue(k, v);
    return out;
  }
  return value;
}

export function buildSafeDiagnostics(input = {}) {
  const bundle = {
    schema: "uaos.diagnostics.safe/v1",
    exportedAt: new Date().toISOString(),
    product: input.product || "UAOS",
    version: input.version || "unknown",
    classification: input.classification || "INTERNAL",
    platform: platformInfo(),
    hostnameHash: crypto.createHash("sha256").update(os.hostname()).digest("hex").slice(0, 16),
    productState: redactValue("productState", input.productState || {}),
    recentErrors: redactValue("recentErrors", (input.recentErrors || []).slice(-20)),
    compatibility: input.compatibility || [],
    recoveryHints: input.recoveryHints || [
      "Close the product window and start again with the Start file.",
      "If a port-busy message appears, wait and retry — alternate ports are tried automatically.",
      "Projects in the DATA folder are preserved across restarts."
    ],
    rights: input.rights || { unclearedShippedAssets: 0 },
    publicRelease: false
  };
  return {
    ok: true,
    bundle,
    sha256: crypto.createHash("sha256").update(JSON.stringify(bundle)).digest("hex")
  };
}
