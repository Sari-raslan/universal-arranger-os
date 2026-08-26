/**
 * Commercial SKU policy: catalog metadata only. Payment stays disabled.
 */
import fs from "node:fs";

const ALLOWED_PAYMENT = new Set(["disabled_until_library_qc", "manual_quote_only", "DISABLED"]);

export function parseJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export function validateSkuCatalog(skus) {
  if (!Array.isArray(skus) || skus.length < 1) {
    return { ok: false, error: "SKU catalog must be a non-empty array." };
  }
  const seen = new Set();
  for (const sku of skus) {
    if (!sku.sku || typeof sku.sku !== "string") return { ok: false, error: "SKU id required." };
    if (seen.has(sku.sku)) return { ok: false, error: `Duplicate SKU: ${sku.sku}` };
    seen.add(sku.sku);
    if (!ALLOWED_PAYMENT.has(sku.payment_status)) {
      return { ok: false, error: `Payment status not allowed: ${sku.payment_status}` };
    }
    if (/stripe|paypal|checkout|price_id/i.test(JSON.stringify(sku))) {
      return { ok: false, error: "Live payment identifiers are forbidden in this catalog." };
    }
  }
  return { ok: true, count: skus.length, paymentLive: false };
}
