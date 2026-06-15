import test from "node:test";
import assert from "node:assert/strict";
import {
  getPlan,
  getPublicPlans,
} from "../server/commercial/plans.mjs";
import {
  commercialConfigStatus,
  readCommercialConfig,
} from "../server/commercial/config.mjs";
import {
  hmacHex,
  verifyHmacHex,
} from "../server/commercial/crypto.mjs";
import {
  issueLicense,
  verifyLicense,
} from "../server/commercial/licenseService.mjs";
import {
  MemoryIdempotencyStore,
  processPaymentWebhook,
} from "../server/commercial/paymentWebhook.mjs";

test("public plans preserve the approved EUR prices", () => {
  const plans = getPublicPlans();
  const byId = Object.fromEntries(
    plans.map((plan) => [plan.id, plan]),
  );

  assert.equal(plans.length, 4);

  assert.equal(byId.free.amountMinor, 0);
  assert.equal(byId.free.requiresPayment, false);

  assert.equal(byId.creator.launchAmountMinor, 799);
  assert.equal(byId.creator.regularAmountMinor, 1299);
  assert.equal(byId.creator.launchMonths, 3);
  assert.equal(byId.creator.currency, "EUR");

  assert.equal(
    byId.professional.launchAmountMinor,
    1999,
  );
  assert.equal(
    byId.professional.regularAmountMinor,
    2999,
  );
  assert.equal(byId.professional.launchMonths, 3);
  assert.equal(byId.professional.currency, "EUR");

  assert.equal(byId.ultimate.regularAmountMinor, 4999);
  assert.equal(byId.ultimate.status, "planned");
});

test("commercial config defaults remain disabled and safe", () => {
  const config = readCommercialConfig({});

  assert.equal(config.paymentProvider, "disabled");
  assert.equal(config.storageMode, "development-memory");
  assert.equal(
    commercialConfigStatus({}).productionReady,
    false,
  );
});

test("strict commercial config rejects missing production secrets", () => {
  assert.throws(
    () => readCommercialConfig({}, { strict: true }),
    /Missing required environment variable/,
  );
});

test("HMAC verification rejects altered payloads", () => {
  const secret = "test-payment-secret";
  const payload = '{"event":"ok"}';
  const signature = hmacHex(secret, payload);

  assert.equal(verifyHmacHex(secret, payload, signature), true);
  assert.equal(
    verifyHmacHex(secret, `${payload}x`, signature),
    false,
  );
});

test("license issuance and verification bind plan and device", () => {
  const secret = "test-license-secret";
  const issued = issueLicense(
    {
      subject: "user-123",
      planId: "professional",
      deviceId: "device-a",
      issuedAt: "2026-06-13T10:00:00.000Z",
      expiresAt: "2026-07-13T10:00:00.000Z",
    },
    secret,
  );

  assert.equal(
    verifyLicense(
      issued.token,
      secret,
      {
        now: "2026-06-20T10:00:00.000Z",
        deviceId: "device-a",
      },
    ).valid,
    true,
  );

  assert.equal(
    verifyLicense(
      issued.token,
      secret,
      {
        now: "2026-06-20T10:00:00.000Z",
        deviceId: "device-b",
      },
    ).reason,
    "device-mismatch",
  );
});

test("webhook processing verifies signatures and is idempotent", () => {
  const secret = "webhook-secret";
  const rawBody = JSON.stringify({
    id: "evt-1",
    type: "subscription.activated",
    data: {
      planId: "creator",
      subject: "user-123",
    },
  });
  const signature = hmacHex(secret, rawBody);
  const store = new MemoryIdempotencyStore();

  const first = processPaymentWebhook({
    rawBody,
    signature,
    secret,
    store,
  });

  const second = processPaymentWebhook({
    rawBody,
    signature,
    secret,
    store,
  });

  assert.equal(first.accepted, true);
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
});

test("webhook processing rejects unknown or unsigned events", () => {
  const secret = "webhook-secret";
  const rawBody = JSON.stringify({
    id: "evt-2",
    type: "unsupported.event",
    data: {},
  });

  assert.throws(
    () => processPaymentWebhook({
      rawBody,
      signature: hmacHex(secret, rawBody),
      secret,
      store: new MemoryIdempotencyStore(),
    }),
    /Unsupported payment event/,
  );

  assert.throws(
    () => processPaymentWebhook({
      rawBody,
      signature: "invalid",
      secret,
      store: new MemoryIdempotencyStore(),
    }),
    /Invalid payment webhook signature/,
  );
});