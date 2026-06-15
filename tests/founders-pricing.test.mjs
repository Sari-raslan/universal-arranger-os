import test from "node:test";
import assert from "node:assert/strict";
import {
  getPlan,
  getPublicPlans,
} from "../server/commercial/plans.mjs";
import {
  findPricingPlan,
  launchOffer,
} from "../uaos-live-clean/src/config/pricing.js";

test("researched founders prices are preserved", () => {
  const studio = findPricingPlan("studio");
  const pro = findPricingPlan("pro");

  assert.equal(launchOffer.durationMonths, 3);
  assert.equal(studio.launchPriceEur, 7.99);
  assert.equal(studio.regularPriceEur, 12.99);
  assert.equal(pro.launchPriceEur, 19.99);
  assert.equal(pro.regularPriceEur, 29.99);
});

test("backend aliases preserve account and Stripe compatibility", () => {
  assert.equal(getPlan("studio").id, "creator");
  assert.equal(getPlan("pro").id, "professional");
  assert.equal(getPlan("creator").regularAmountMinor, 1299);
  assert.equal(getPlan("professional").regularAmountMinor, 2999);
  assert.equal(getPlan("ultimate").regularAmountMinor, 4999);
});

test("checkout remains disabled until intro schedule is verified", () => {
  assert.equal(
    findPricingPlan("studio").checkoutEnabled,
    false,
  );
  assert.equal(
    findPricingPlan("pro").checkoutEnabled,
    false,
  );
});

test("Ultimate remains planned and is not launched", () => {
  const plans = getPublicPlans();
  const ultimate = plans.find((plan) => plan.id === "ultimate");

  assert.equal(ultimate.status, "planned");
  assert.equal(ultimate.regularAmountMinor, 4999);
});