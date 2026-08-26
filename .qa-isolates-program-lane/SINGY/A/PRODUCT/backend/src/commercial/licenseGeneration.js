/**
 * Offline founding-pilot license token generation.
 * Does NOT activate payment, public delivery, or hardware write.
 */
import crypto from "node:crypto";

const SKUS = Object.freeze(["arranger-studio", "midi-toolkit", "singy"]);

export function generateOfflineLicense({
  sku,
  customerId = "FOUNDING_PILOT",
  issuedAt = new Date().toISOString(),
  seatCount = 1
} = {}) {
  if (!SKUS.includes(sku)) {
    return { ok: false, errorCode: "UNKNOWN_SKU", allowed: SKUS };
  }
  if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 5) {
    return { ok: false, errorCode: "INVALID_SEAT_COUNT" };
  }
  const payload = {
    schema: "uaos.license.offline/v1",
    sku,
    customerId: String(customerId).slice(0, 64),
    issuedAt,
    seatCount,
    paymentActive: false,
    publicDelivery: false,
    hardwareWrite: false
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", "uaos-local-dev-not-for-production").update(body).digest("base64url");
  return {
    ok: true,
    token: `UAOS1.${body}.${sig}`,
    payload,
    paymentActivation: false,
    musicalQualityClaim: false
  };
}

export function verifyOfflineLicense(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "UAOS1") {
    return { ok: false, errorCode: "MALFORMED_TOKEN" };
  }
  const [, body, sig] = parts;
  const expect = crypto.createHmac("sha256", "uaos-local-dev-not-for-production").update(body).digest("base64url");
  if (sig !== expect) return { ok: false, errorCode: "BAD_SIGNATURE" };
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, errorCode: "BAD_PAYLOAD" };
  }
  if (payload.paymentActive || payload.publicDelivery || payload.hardwareWrite) {
    return { ok: false, errorCode: "UNSAFE_CLAIMS" };
  }
  return { ok: true, payload, paymentActivation: false };
}

export function runLicenseGenerationSuite() {
  const results = SKUS.map((sku) => generateOfflineLicense({ sku, customerId: `pilot-${sku}` }));
  const verified = results.map((r) => verifyOfflineLicense(r.token));
  const bad = verifyOfflineLicense("UAOS1.bad.sig");
  return {
    ok: results.every((r) => r.ok) && verified.every((v) => v.ok) && bad.ok === false,
    generated: results.length,
    verified: verified.filter((v) => v.ok).length
  };
}
