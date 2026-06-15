import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildPasswordResetUrl,
  buildVerificationUrl,
  createSmtpEmailService,
} from "../server/production/smtpEmailService.mjs";
import {
  productionIntegrationsStatus,
  readProductionIntegrationsConfig,
} from "../server/production/config.mjs";
import {
  PostgresAccountService,
} from "../server/production/postgresAccountService.mjs";

const root = process.cwd();

class FakeRepository {
  constructor() {
    this.users = new Map();
    this.verificationTokens = new Map();
    this.sessions = new Map();
    this.resetTokens = new Map();
  }

  async createUser(input) {
    if (this.users.has(input.email)) {
      const error = new Error("duplicate");
      error.code = "23505";
      throw error;
    }

    const user = {
      id: input.id,
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: input.createdAt,
      emailVerifiedAt: null,
      subscription: null,
      licenseIds: [],
    };

    this.users.set(input.email, user);
    this.verificationTokens.set(
      input.verificationTokenHash,
      {
        user,
        expiresAt: input.verificationExpiresAt,
      },
    );

    return user;
  }

  async findUserByEmail(email) {
    return this.users.get(email) || null;
  }

  async verifyEmailByTokenHash(tokenHash, verifiedAt) {
    const record = this.verificationTokens.get(tokenHash);

    if (
      !record ||
      new Date(record.expiresAt) <= new Date(verifiedAt)
    ) {
      return null;
    }

    record.user.emailVerifiedAt = verifiedAt;
    this.verificationTokens.delete(tokenHash);
    return record.user;
  }

  async createSession(input) {
    this.sessions.set(input.tokenHash, {
      ...input,
      user: [...this.users.values()].find(
        (item) => item.id === input.userId,
      ),
    });
  }

  async findUserBySessionHash(tokenHash, now) {
    const session = this.sessions.get(tokenHash);

    if (
      !session ||
      new Date(session.expiresAt) <= new Date(now)
    ) {
      return null;
    }

    return session.user;
  }

  async revokeSession(tokenHash) {
    return this.sessions.delete(tokenHash);
  }

  async replacePasswordResetToken({
    email,
    tokenHash,
    expiresAt,
  }) {
    const user = this.users.get(email);

    if (!user) {
      return null;
    }

    this.resetTokens.set(tokenHash, {
      user,
      expiresAt,
    });

    return user.id;
  }

  async consumePasswordResetToken({
    tokenHash,
    passwordHash,
    now,
  }) {
    const record = this.resetTokens.get(tokenHash);

    if (
      !record ||
      new Date(record.expiresAt) <= new Date(now)
    ) {
      return false;
    }

    record.user.passwordHash = passwordHash;
    this.resetTokens.delete(tokenHash);

    for (const [key, session] of this.sessions.entries()) {
      if (session.user.id === record.user.id) {
        this.sessions.delete(key);
      }
    }

    return true;
  }

  async upsertSubscription(input) {
    const user = this.users.get(input.email);

    if (!user) {
      return null;
    }

    user.subscription = {
      planId: input.planId,
      status: input.status,
      providerCustomerId: input.providerCustomerId,
      providerSubscriptionId: input.providerSubscriptionId,
      currentPeriodEnd: input.currentPeriodEnd,
      updatedAt: input.updatedAt,
    };

    return user;
  }
}

test("strict production config requires database and SMTP secrets", () => {
  assert.throws(
    () => readProductionIntegrationsConfig(
      {},
      { strict: true },
    ),
    /Missing required environment variable/,
  );

  assert.equal(
    productionIntegrationsStatus({}).productionConfigured,
    false,
  );
});

test("verification and reset URLs point to UAOS account routes", () => {
  const verification = buildVerificationUrl(
    "https://uaos.example",
    "verify-token",
  );
  const reset = buildPasswordResetUrl(
    "https://uaos.example",
    "reset-token",
  );

  assert.match(verification, /#\/account\/verify/);
  assert.match(verification, /token=verify-token/);
  assert.match(reset, /#\/account\/reset/);
  assert.match(reset, /token=reset-token/);
});

test("SMTP service sends verification and reset messages", async () => {
  const messages = [];
  const fakeTransport = {
    async verify() {
      return true;
    },
    async sendMail(message) {
      messages.push(message);
      return { messageId: `message-${messages.length}` };
    },
  };

  const service = createSmtpEmailService(
    {
      publicBaseUrl: "https://uaos.example",
      smtpHost: "smtp.example",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "user",
      smtpPassword: "secret",
      smtpFrom: "UAOS <no-reply@uaos.example>",
      supportEmail: "support@uaos.example",
    },
    fakeTransport,
  );

  await service.sendVerificationEmail({
    email: "user@example.com",
    token: "verify-token",
  });

  await service.sendPasswordResetEmail({
    email: "user@example.com",
    token: "reset-token",
  });

  assert.equal(messages.length, 2);
  assert.match(messages[0].subject, /Verify/);
  assert.match(messages[1].subject, /Reset/);
  assert.equal(messages[0].to, "user@example.com");
});

test("Postgres account service works through repository contract", async () => {
  const repository = new FakeRepository();
  const service = new PostgresAccountService(repository, {
    now: () => new Date("2026-06-13T10:00:00.000Z"),
  });

  const registration = await service.register({
    email: "PRODUCTION@example.com",
    password: "A-strong-production-password-123",
  });

  await assert.rejects(
    () => service.login({
      email: "production@example.com",
      password: "A-strong-production-password-123",
    }),
    /verification is required/i,
  );

  await service.verifyEmail(registration.verificationToken);

  const login = await service.login({
    email: "production@example.com",
    password: "A-strong-production-password-123",
  });

  assert.equal(
    (
      await service.authenticateSession(login.sessionToken)
    ).email,
    "production@example.com",
  );

  const reset = await service.requestPasswordReset(
    "production@example.com",
  );

  await service.resetPassword({
    token: reset.resetToken,
    password: "A-new-production-password-456",
  });

  assert.equal(
    await service.authenticateSession(login.sessionToken),
    null,
  );
});

test("account migration contains normalized constraints", () => {
  const sql = fs.readFileSync(
    path.join(root, "migrations", "001_accounts.sql"),
    "utf8",
  );

  for (const marker of [
    "CREATE TABLE IF NOT EXISTS uaos_users",
    "CREATE TABLE IF NOT EXISTS uaos_sessions",
    "CREATE TABLE IF NOT EXISTS uaos_subscriptions",
    "REFERENCES uaos_users(id) ON DELETE CASCADE",
    "CHECK (plan_id IN ('creator', 'professional'))",
  ]) {
    assert.equal(sql.includes(marker), true);
  }
});

test("production server does not expose email tokens", () => {
  const source = fs.readFileSync(
    path.join(
      root,
      "server",
      "production",
      "accountsServer.mjs",
    ),
    "utf8",
  );

  assert.equal(
    source.includes("verificationToken: result.verificationToken"),
    false,
  );
  assert.equal(
    source.includes("resetToken: result.resetToken"),
    false,
  );
  assert.equal(source.includes("sendVerificationEmail"), true);
  assert.equal(source.includes("sendPasswordResetEmail"), true);
});