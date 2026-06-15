import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getPlan,
} from "../server/commercial/plans.mjs";
import {
  findPricingPlan,
  launchOffer,
} from "../uaos-live-clean/src/config/pricing.js";

const root = process.cwd();

test("canonical founders pricing is synchronized", () => {
  const value = JSON.parse(
    fs.readFileSync(
      path.join(root, "config", "uaos-pricing.json"),
      "utf8",
    ),
  );

  const plans = Object.fromEntries(
    value.plans.map((plan) => [plan.id, plan]),
  );

  assert.equal(
    value.offer.introductoryPaidMonths,
    3,
  );
  assert.equal(
    value.offer.checkoutEnabled,
    false,
  );

  assert.equal(plans.sing.regularAmountMinor, 0);
  assert.equal(plans.studio.launchAmountMinor, 799);
  assert.equal(plans.studio.regularAmountMinor, 1299);
  assert.equal(plans.pro.launchAmountMinor, 1999);
  assert.equal(plans.pro.regularAmountMinor, 2999);
  assert.equal(plans.ultimate.regularAmountMinor, 4999);
  assert.equal(plans.ultimate.status, "planned");
});

test("server pricing agrees with the founders offer", () => {
  assert.equal(getPlan("studio").id, "creator");
  assert.equal(getPlan("studio").launchAmountMinor, 799);
  assert.equal(getPlan("studio").regularAmountMinor, 1299);

  assert.equal(getPlan("pro").id, "professional");
  assert.equal(getPlan("pro").launchAmountMinor, 1999);
  assert.equal(getPlan("pro").regularAmountMinor, 2999);

  assert.equal(getPlan("ultimate").regularAmountMinor, 4999);
  assert.equal(getPlan("ultimate").status, "planned");
});

test("frontend pricing agrees with the founders offer", () => {
  assert.equal(launchOffer.durationMonths, 3);
  assert.equal(
    launchOffer.paymentScheduleVerified,
    false,
  );

  const studio = findPricingPlan("studio");
  const pro = findPricingPlan("pro");
  const ultimate = findPricingPlan("ultimate");

  assert.equal(studio.launchPriceEur, 7.99);
  assert.equal(studio.regularPriceEur, 12.99);
  assert.equal(studio.checkoutEnabled, false);

  assert.equal(pro.launchPriceEur, 19.99);
  assert.equal(pro.regularPriceEur, 29.99);
  assert.equal(pro.checkoutEnabled, false);

  assert.equal(ultimate.regularPriceEur, 49.99);
  assert.equal(ultimate.status, "planned");
});