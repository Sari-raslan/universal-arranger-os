import { randomUUID } from "node:crypto";
import { getPlan } from "../commercial/plans.mjs";
import {
  hashPassword,
  verifyPassword,
} from "./passwords.mjs";
import {
  createOpaqueToken,
  hashOpaqueToken,
  safeTokenHashEqual,
} from "./tokens.mjs";

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

function validUntil(expiresAt, now) {
  return new Date(expiresAt).getTime() > new Date(now).getTime();
}

export class AccountService {
  constructor(store, { now = () => new Date() } = {}) {
    this.store = store;
    this.now = now;
  }

  async register({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await hashPassword(password);
    const verificationToken = createOpaqueToken();
    const verificationHash = hashOpaqueToken(verificationToken);
    const issuedAt = this.now();

    const user = await this.store.transaction(async (state) => {
      if (state.users.some((item) => item.email === normalizedEmail)) {
        throw new Error("An account with this email already exists.");
      }

      const nextUser = {
        id: randomUUID(),
        email: normalizedEmail,
        passwordHash,
        createdAt: issuedAt.toISOString(),
        emailVerifiedAt: null,
        subscription: null,
        licenseIds: [],
      };

      state.users.push(nextUser);
      state.verificationTokens = state.verificationTokens.filter(
        (item) => item.userId !== nextUser.id,
      );
      state.verificationTokens.push({
        userId: nextUser.id,
        tokenHash: verificationHash,
        expiresAt: new Date(
          issuedAt.getTime() + VERIFY_AGE_MS,
        ).toISOString(),
      });

      return nextUser;
    });

    return {
      user: publicUser(user),
      verificationToken,
    };
  }

  async verifyEmail(token) {
    const tokenHash = hashOpaqueToken(token);
    const now = this.now();

    return this.store.transaction(async (state) => {
      const record = state.verificationTokens.find(
        (item) =>
          safeTokenHashEqual(item.tokenHash, tokenHash) &&
          validUntil(item.expiresAt, now),
      );

      if (!record) {
        throw new Error("Verification token is invalid or expired.");
      }

      const user = state.users.find(
        (item) => item.id === record.userId,
      );

      if (!user) {
        throw new Error("Verification account no longer exists.");
      }

      user.emailVerifiedAt = now.toISOString();
      state.verificationTokens = state.verificationTokens.filter(
        (item) => item.userId !== user.id,
      );

      return publicUser(user);
    });
  }

  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const state = await this.store.read();
    const user = state.users.find(
      (item) => item.email === normalizedEmail,
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

    const rawToken = createOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);
    const now = this.now();

    await this.store.transaction(async (working) => {
      working.sessions = working.sessions.filter(
        (item) => validUntil(item.expiresAt, now),
      );
      working.sessions.push({
        id: randomUUID(),
        userId: user.id,
        tokenHash,
        createdAt: now.toISOString(),
        expiresAt: new Date(
          now.getTime() + SESSION_AGE_MS,
        ).toISOString(),
      });
    });

    return {
      user: publicUser(user),
      sessionToken: rawToken,
    };
  }

  async authenticateSession(rawToken) {
    const tokenHash = hashOpaqueToken(rawToken);
    const now = this.now();
    const state = await this.store.read();

    const session = state.sessions.find(
      (item) =>
        safeTokenHashEqual(item.tokenHash, tokenHash) &&
        validUntil(item.expiresAt, now),
    );

    if (!session) {
      return null;
    }

    const user = state.users.find(
      (item) => item.id === session.userId,
    );

    return user ? publicUser(user) : null;
  }

  async logout(rawToken) {
    const tokenHash = hashOpaqueToken(rawToken);

    return this.store.transaction(async (state) => {
      const before = state.sessions.length;

      state.sessions = state.sessions.filter(
        (item) => !safeTokenHashEqual(item.tokenHash, tokenHash),
      );

      return {
        revoked: state.sessions.length !== before,
      };
    });
  }

  async requestPasswordReset(email) {
    const normalizedEmail = normalizeEmail(email);
    const rawToken = createOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);
    const now = this.now();

    const created = await this.store.transaction(async (state) => {
      const user = state.users.find(
        (item) => item.email === normalizedEmail,
      );

      if (!user) {
        return false;
      }

      state.passwordResetTokens = state.passwordResetTokens.filter(
        (item) => item.userId !== user.id,
      );
      state.passwordResetTokens.push({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(
          now.getTime() + RESET_AGE_MS,
        ).toISOString(),
      });

      return true;
    });

    return {
      accepted: true,
      resetToken: created ? rawToken : null,
    };
  }

  async resetPassword({ token, password }) {
    const tokenHash = hashOpaqueToken(token);
    const nextPasswordHash = await hashPassword(password);
    const now = this.now();

    return this.store.transaction(async (state) => {
      const record = state.passwordResetTokens.find(
        (item) =>
          safeTokenHashEqual(item.tokenHash, tokenHash) &&
          validUntil(item.expiresAt, now),
      );

      if (!record) {
        throw new Error("Password reset token is invalid or expired.");
      }

      const user = state.users.find(
        (item) => item.id === record.userId,
      );

      if (!user) {
        throw new Error("Password reset account no longer exists.");
      }

      user.passwordHash = nextPasswordHash;
      state.passwordResetTokens = state.passwordResetTokens.filter(
        (item) => item.userId !== user.id,
      );
      state.sessions = state.sessions.filter(
        (item) => item.userId !== user.id,
      );

      return {
        changed: true,
      };
    });
  }

  async applySubscription({
    email,
    planId,
    status,
    providerCustomerId = null,
    providerSubscriptionId = null,
    currentPeriodEnd = null,
  }) {
    const normalizedEmail = normalizeEmail(email);
    getPlan(planId);

    const allowedStatuses = new Set([
      "active",
      "past_due",
      "cancelled",
      "expired",
    ]);

    if (!allowedStatuses.has(status)) {
      throw new Error(`Unsupported subscription status: ${status}`);
    }

    return this.store.transaction(async (state) => {
      const user = state.users.find(
        (item) => item.email === normalizedEmail,
      );

      if (!user) {
        throw new Error("Subscription account was not found.");
      }

      user.subscription = {
        planId,
        status,
        providerCustomerId,
        providerSubscriptionId,
        currentPeriodEnd,
        updatedAt: this.now().toISOString(),
      };

      return publicUser(user);
    });
  }
}