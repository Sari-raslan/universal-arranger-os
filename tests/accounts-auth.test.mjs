import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
} from "../server/accounts/passwords.mjs";
import {
  AccountService,
} from "../server/accounts/accountService.mjs";
import {
  MemoryAccountStore,
} from "../server/accounts/stores.mjs";

function fixedClock(start = "2026-06-13T10:00:00.000Z") {
  let current = new Date(start);

  return {
    now: () => new Date(current),
    advance(milliseconds) {
      current = new Date(current.getTime() + milliseconds);
    },
  };
}

test("password hashes are salted and verifiable", async () => {
  const first = await hashPassword("A-strong-test-password-123");
  const second = await hashPassword("A-strong-test-password-123");

  assert.notEqual(first, second);
  assert.equal(
    await verifyPassword(
      "A-strong-test-password-123",
      first,
    ),
    true,
  );
  assert.equal(
    await verifyPassword("wrong-password-123", first),
    false,
  );
});

test("registration requires verification before login", async () => {
  const clock = fixedClock();
  const store = new MemoryAccountStore();
  const service = new AccountService(store, {
    now: clock.now,
  });

  const registration = await service.register({
    email: "User@Example.com",
    password: "A-strong-test-password-123",
  });

  assert.equal(registration.user.email, "user@example.com");
  assert.equal(registration.user.emailVerified, false);

  await assert.rejects(
    () => service.login({
      email: "user@example.com",
      password: "A-strong-test-password-123",
    }),
    /verification is required/i,
  );

  const verified = await service.verifyEmail(
    registration.verificationToken,
  );

  assert.equal(verified.emailVerified, true);
});

test("login creates an opaque session and logout revokes it", async () => {
  const store = new MemoryAccountStore();
  const service = new AccountService(store);
  const registration = await service.register({
    email: "session@example.com",
    password: "A-strong-test-password-123",
  });

  await service.verifyEmail(registration.verificationToken);

  const login = await service.login({
    email: "session@example.com",
    password: "A-strong-test-password-123",
  });

  assert.equal(
    (await service.authenticateSession(login.sessionToken)).email,
    "session@example.com",
  );

  assert.equal(
    (await service.logout(login.sessionToken)).revoked,
    true,
  );

  assert.equal(
    await service.authenticateSession(login.sessionToken),
    null,
  );
});

test("password reset changes password and revokes sessions", async () => {
  const store = new MemoryAccountStore();
  const service = new AccountService(store);
  const registration = await service.register({
    email: "reset@example.com",
    password: "A-strong-test-password-123",
  });

  await service.verifyEmail(registration.verificationToken);

  const login = await service.login({
    email: "reset@example.com",
    password: "A-strong-test-password-123",
  });

  const reset = await service.requestPasswordReset(
    "reset@example.com",
  );

  await service.resetPassword({
    token: reset.resetToken,
    password: "A-new-strong-password-456",
  });

  assert.equal(
    await service.authenticateSession(login.sessionToken),
    null,
  );

  await assert.rejects(
    () => service.login({
      email: "reset@example.com",
      password: "A-strong-test-password-123",
    }),
    /Invalid email or password/,
  );

  assert.equal(
    (
      await service.login({
        email: "reset@example.com",
        password: "A-new-strong-password-456",
      })
    ).user.email,
    "reset@example.com",
  );
});

test("subscription state links only known plans", async () => {
  const store = new MemoryAccountStore();
  const service = new AccountService(store);
  const registration = await service.register({
    email: "plan@example.com",
    password: "A-strong-test-password-123",
  });

  const updated = await service.applySubscription({
    email: "plan@example.com",
    planId: "professional",
    status: "active",
    providerCustomerId: "customer-1",
    providerSubscriptionId: "subscription-1",
  });

  assert.equal(
    updated.subscription.planId,
    "professional",
  );

  await assert.rejects(
    () => service.applySubscription({
      email: "plan@example.com",
      planId: "unknown",
      status: "active",
    }),
    /Unknown UAOS plan/,
  );

  assert.equal(registration.user.subscription, null);
});