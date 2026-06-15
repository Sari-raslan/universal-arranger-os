import { randomUUID } from "node:crypto";
import { getPlan } from "../commercial/plans.mjs";
import {
  hashPassword,
  verifyPassword,
} from "../accounts/passwords.mjs";
import {
  createOpaqueToken,
  hashOpaqueToken,
} from "../accounts/tokens.mjs";

const SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const VERIFY_AGE_MS = 24 * 60 * 60 * 1000;
const RESET_AGE_MS = 60 * 60 * 1000;

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();

  if (
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  ) {
    throw new Error("A valid email address is required.");
  }

  return value;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt,
    subscription: user.subscription || null,
    licenseIds: [...(user.licenseIds || [])],
  };
}

export class PostgresAccountService {
  constructor(repository, { now = () => new Date() } = {}) {
    this.repository = repository;
    this.now = now;
  }

  async register({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await hashPassword(password);
    const token = createOpaqueToken();
    const now = this.now();

    try {
      const user = await this.repository.createUser({
        id: randomUUID(),
        email: normalizedEmail,
        passwordHash,
        createdAt: now.toISOString(),
        verificationTokenHash: hashOpaqueToken(token),
        verificationExpiresAt: new Date(
          now.getTime() + VERIFY_AGE_MS,
        ).toISOString(),
      });

      return {
        user: publicUser(user),
        verificationToken: token,
      };
    } catch (error) {
      if (error?.code === "23505") {
        throw new Error("An account with this email already exists.");
      }

      throw error;
    }
  }

  async verifyEmail(token) {
    const user = await this.repository.verifyEmailByTokenHash(
      hashOpaqueToken(token),
      this.now().toISOString(),
    );

    if (!user) {
      throw new Error("Verification token is invalid or expired.");
    }

    return publicUser(user);
  }

  async login({ email, password }) {
    const user = await this.repository.findUserByEmail(
      normalizeEmail(email),
    );

    if (
      !user ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      throw new Error("Invalid email or password.");
    }

    if (!user.emailVerifiedAt) {
      throw new Error("Email verification is required.");
    }

    const token = createOpaqueToken();
    const now = this.now();

    await this.repository.createSession({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashOpaqueToken(token),
      createdAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + SESSION_AGE_MS,
      ).toISOString(),
    });

    return {
      user: publicUser(user),
      sessionToken: token,
    };
  }

  async authenticateSession(token) {
    if (!token) {
      return null;
    }

    const user = await this.repository.findUserBySessionHash(
      hashOpaqueToken(token),
      this.now().toISOString(),
    );

    return user ? publicUser(user) : null;
  }

  async logout(token) {
    return {
      revoked: await this.repository.revokeSession(
        hashOpaqueToken(token),
      ),
    };
  }

  async requestPasswordReset(email) {
    const normalizedEmail = normalizeEmail(email);
    const token = createOpaqueToken();
    const now = this.now();

    const userId = await this.repository.replacePasswordResetToken({
      email: normalizedEmail,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(
        now.getTime() + RESET_AGE_MS,
      ).toISOString(),
    });

    return {
      accepted: true,
      email: normalizedEmail,
      resetToken: userId ? token : null,
    };
  }

  async resetPassword({ token, password }) {
    const changed = await this.repository.consumePasswordResetToken({
      tokenHash: hashOpaqueToken(token),
      passwordHash: await hashPassword(password),
      now: this.now().toISOString(),
    });

    if (!changed) {
      throw new Error("Password reset token is invalid or expired.");
    }

    return {
      changed: true,
    };
  }

  async applySubscription(input) {
    const email = normalizeEmail(input.email);
    getPlan(input.planId);

    const allowedStatuses = new Set([
      "active",
      "past_due",
      "cancelled",
      "expired",
    ]);

    if (!allowedStatuses.has(input.status)) {
      throw new Error(
        `Unsupported subscription status: ${input.status}`,
      );
    }

    const user = await this.repository.upsertSubscription({
      email,
      planId: input.planId,
      status: input.status,
      providerCustomerId: input.providerCustomerId || null,
      providerSubscriptionId:
        input.providerSubscriptionId || null,
      currentPeriodEnd: input.currentPeriodEnd || null,
      updatedAt: this.now().toISOString(),
    });

    if (!user) {
      throw new Error("Subscription account was not found.");
    }

    return publicUser(user);
  }
}