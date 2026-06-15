import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildFoundersScheduleUpdate,
  ensureFoundersSubscriptionSchedule,
  foundersScheduleConfigured,
} from "../server/production/foundersStripeSchedule.mjs";
import {
  StripeBilling,
  readStripeConfig,
  stripeStatus,
} from "../server/production/stripeBilling.mjs";

const environment = {
  UAOS_STRIPE_SECRET_KEY: "sk_test_example",
  UAOS_STRIPE_WEBHOOK_SECRET: "whsec_example",
  UAOS_STRIPE_FOUNDERS_SCHEDULE_ENABLED: "true",
  UAOS_STRIPE_PRICE_CREATOR_INTRO: "price_creator_intro",
  UAOS_STRIPE_PRICE_CREATOR_REGULAR: "price_creator_regular",
  UAOS_STRIPE_PRICE_PROFESSIONAL_INTRO: "price_pro_intro",
  UAOS_STRIPE_PRICE_PROFESSIONAL_REGULAR: "price_pro_regular",
};

test("strict config accepts the complete founders schedule", () => {
  const config = readStripeConfig(environment, {
    strict: true,
  });

  assert.equal(config.foundersScheduleEnabled, true);
  assert.equal(foundersScheduleConfigured(config), true);

  const status = stripeStatus(environment);

  assert.equal(status.foundersScheduleEnabled, true);
  assert.equal(status.configured, true);
});

test("founders phase lasts three months then uses regular price", () => {
  const config = readStripeConfig(environment, {
    strict: true,
  });

  const update = buildFoundersScheduleUpdate({
    config,
    planId: "creator",
    schedule: {
      current_phase: {
        start: 1700000000,
      },
    },
    subscription: {
      current_period_start: 1700000000,
    },
  });

  assert.equal(update.end_behavior, "release");
  assert.equal(update.phases.length, 2);
  assert.equal(
    update.phases[0].items[0].price,
    "price_creator_intro",
  );
  assert.deepEqual(update.phases[0].duration, {
    interval: "month",
    interval_count: 3,
  });
  assert.equal(
    update.phases[1].items[0].price,
    "price_creator_regular",
  );
  assert.equal(
    update.phases[0].proration_behavior,
    "none",
  );
  assert.equal(
    update.phases[1].proration_behavior,
    "none",
  );
});

test("schedule setup uses create-from-subscription then update", async () => {
  const calls = [];
  const stripe = {
    subscriptionSchedules: {
      create: async (payload, options) => {
        calls.push(["create", payload, options]);

        return {
          id: "sub_sched_1",
          current_phase: {
            start: 1700000000,
          },
          phases: [
            {
              start_date: 1700000000,
            },
          ],
        };
      },
      update: async (id, payload, options) => {
        calls.push(["update", id, payload, options]);

        return {
          id,
        };
      },
      retrieve: async () => {
        throw new Error("retrieve should not run");
      },
    },
  };

  const config = readStripeConfig(environment, {
    strict: true,
  });

  const result =
    await ensureFoundersSubscriptionSchedule({
      stripe,
      config,
      planId: "professional",
      subscription: {
        id: "sub_1",
        schedule: null,
        current_period_start: 1700000000,
      },
      eventId: "evt_1",
    });

  assert.equal(result.scheduleId, "sub_sched_1");
  assert.equal(result.created, true);
  assert.equal(result.updated, true);
  assert.equal(calls[0][0], "create");
  assert.deepEqual(calls[0][1], {
    from_subscription: "sub_1",
  });
  assert.equal(calls[1][0], "update");
  assert.equal(
    calls[1][2].phases[0].items[0].price,
    "price_pro_intro",
  );
  assert.equal(
    calls[1][2].phases[1].items[0].price,
    "price_pro_regular",
  );
});

test("existing non-UAOS schedules are never overwritten", async () => {
  const stripe = {
    subscriptionSchedules: {
      retrieve: async () => ({
        id: "sub_sched_external",
        metadata: {},
      }),
    },
  };

  const config = readStripeConfig(environment, {
    strict: true,
  });

  await assert.rejects(
    ensureFoundersSubscriptionSchedule({
      stripe,
      config,
      planId: "creator",
      subscription: {
        id: "sub_2",
        schedule: "sub_sched_external",
      },
      eventId: "evt_2",
    }),
    /non-UAOS Stripe schedule/,
  );
});

test("Checkout selects the intro price when enabled", async () => {
  let checkoutInput;

  const fakeStripe = {
    checkout: {
      sessions: {
        create: async (input) => {
          checkoutInput = input;

          return {
            id: "cs_1",
            url: "https://checkout.test/session",
          };
        },
      },
    },
    billingPortal: {
      sessions: {
        create: async () => ({
          id: "bps_1",
          url: "https://portal.test/session",
        }),
      },
    },
    webhooks: {
      constructEvent() {
        return null;
      },
    },
  };

  const billing = new StripeBilling({
    config: readStripeConfig(environment, {
      strict: true,
    }),
    publicBaseUrl: "https://uaos.test",
    pool: {},
    stripe: fakeStripe,
  });

  await billing.checkout({
    user: {
      id: "user_1",
      email: "user@example.test",
    },
    customerId: null,
    planId: "creator",
  });

  assert.equal(
    checkoutInput.line_items[0].price,
    "price_creator_intro",
  );
  assert.equal(
    checkoutInput.metadata.uaosFoundersSchedule,
    "true",
  );
});

test("migration and webhook integration store schedule identity", () => {
  const sql = fs.readFileSync(
    "migrations/003_founders_subscription_schedule.sql",
    "utf8",
  );
  const billingSource = fs.readFileSync(
    "server/production/stripeBilling.mjs",
    "utf8",
  );

  assert.match(sql, /provider_schedule_id/);
  assert.match(
    billingSource,
    /ensureFoundersSchedule/,
  );
  assert.match(
    billingSource,
    /provider_schedule_id/,
  );
});

