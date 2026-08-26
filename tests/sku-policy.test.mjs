import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateSkuCatalog } from "../backend/src/catalog/skuPolicy.js";

const SKU_PATH =
  "C:/UAOS_AGENT_FACTORY_WORKTREES/library-l-130-merged-20260808-150246/uaos-ai-factory/uaos-v1716-golden-set-factory/sections/04_commercial_library_factory/UAOS_COMMERCIAL_LIBRARY_SKUS_DRAFT.json";

test("commercial SKU draft keeps payment disabled", () => {
  const skus = JSON.parse(fs.readFileSync(SKU_PATH, "utf8"));
  const result = validateSkuCatalog(skus);
  assert.equal(result.ok, true, result.error);
  assert.equal(result.paymentLive, false);
  assert.ok(result.count >= 3);
});

test("live payment identifiers are rejected", () => {
  const result = validateSkuCatalog([
    {
      sku: "BAD",
      title: "BAD",
      payment_status: "disabled_until_library_qc",
      stripe_price_id: "price_live"
    }
  ]);
  assert.equal(result.ok, false);
});
