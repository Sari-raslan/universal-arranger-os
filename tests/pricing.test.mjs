import test from "node:test";
import assert from "node:assert/strict";
import { launchOffer, pricingPlans, findPricingPlan } from "../uaos-live-clean/src/config/pricing.js";

test("approved founders pricing is configured", () => {
  const studio = findPricingPlan("studio");
  const pro = findPricingPlan("pro");

  assert.equal(launchOffer.durationMonths, 3);
  assert.equal(studio.launchPriceEur, 7.99);
  assert.equal(studio.regularPriceEur, 12.99);
  assert.equal(pro.launchPriceEur, 19.99);
  assert.equal(pro.regularPriceEur, 29.99);
  assert.ok(studio.launchPriceEur < studio.regularPriceEur);
  assert.ok(pro.launchPriceEur < pro.regularPriceEur);
});

test("PayPal remains review-only until amounts are verified", () => {
  for (const plan of pricingPlans.filter((item) => item.checkoutUrl)) {
    assert.equal(plan.checkoutEnabled, false);
    assert.equal(plan.checkoutStatus, "paypal-amount-verification-required");
    assert.match(plan.checkoutUrl, /^https:\/\/www\.paypal\.com\/ncp\/payment\//);
  }
});

test("Ultimate remains a future plan", () => {
  const ultimate = pricingPlans.find(
    (plan) => plan.id === "ultimate",
  );

  assert.ok(ultimate);
  assert.equal(ultimate.launchPriceEur, null);
  assert.equal(ultimate.regularPriceEur, 49.99);
  assert.equal(ultimate.status, "planned");
  assert.equal(ultimate.checkoutEnabled, false);
});