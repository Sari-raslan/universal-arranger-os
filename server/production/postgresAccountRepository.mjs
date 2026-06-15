import { Pool } from "pg";

function rowToUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at).toISOString(),
    emailVerifiedAt: row.email_verified_at
      ? new Date(row.email_verified_at).toISOString()
      : null,
    subscription: row.plan_id
      ? {
          planId: row.plan_id,
          status: row.subscription_status,
          providerCustomerId: row.provider_customer_id,
          providerSubscriptionId: row.provider_subscription_id,
          currentPeriodEnd: row.current_period_end
            ? new Date(row.current_period_end).toISOString()
            : null,
          updatedAt: new Date(row.subscription_updated_at).toISOString(),
        }
      : null,
    licenseIds: [],
  };
}

const userSelect = `
  SELECT
    users.id,
    users.email,
    users.password_hash,
    users.created_at,
    users.email_verified_at,
    subscriptions.plan_id,
    subscriptions.status AS subscription_status,
    subscriptions.provider_customer_id,
    subscriptions.provider_subscription_id,
    subscriptions.current_period_end,
    subscriptions.updated_at AS subscription_updated_at
  FROM uaos_users AS users
  LEFT JOIN uaos_subscriptions AS subscriptions
    ON subscriptions.user_id = users.id
`;

export class PostgresAccountRepository {
  constructor({
    connectionString,
    ssl = true,
    pool = null,
  }) {
    if (!pool && !connectionString) {
      throw new Error("PostgreSQL connection string is required.");
    }

    this.pool = pool || new Pool({
      connectionString,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    this.ownsPool = !pool;
  }

  async close() {
    if (this.ownsPool) {
      await this.pool.end();
    }
  }

  async health() {
    const result = await this.pool.query(
      "SELECT NOW() AS now, current_database() AS database",
    );

    return result.rows[0];
  }

  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createUser({
    id,
    email,
    passwordHash,
    createdAt,
    verificationTokenHash,
    verificationExpiresAt,
  }) {
    return this.transaction(async (client) => {
      await client.query(
        `
          INSERT INTO uaos_users (
            id,
            email,
            password_hash,
            created_at
          )
          VALUES ($1, $2, $3, $4)
        `,
        [id, email, passwordHash, createdAt],
      );

      await client.query(
        `
          INSERT INTO uaos_email_verification_tokens (
            user_id,
            token_hash,
            expires_at
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id)
          DO UPDATE SET
            token_hash = EXCLUDED.token_hash,
            expires_at = EXCLUDED.expires_at
        `,
        [id, verificationTokenHash, verificationExpiresAt],
      );

      return this.findUserById(id, client);
    });
  }

  async findUserById(id, client = this.pool) {
    const result = await client.query(
      `${userSelect} WHERE users.id = $1`,
      [id],
    );

    return rowToUser(result.rows[0]);
  }

  async findUserByEmail(email, client = this.pool) {
    const result = await client.query(
      `${userSelect} WHERE users.email = $1`,
      [email],
    );

    return rowToUser(result.rows[0]);
  }

  async verifyEmailByTokenHash(tokenHash, verifiedAt) {
    return this.transaction(async (client) => {
      const tokenResult = await client.query(
        `
          SELECT user_id
          FROM uaos_email_verification_tokens
          WHERE token_hash = $1
            AND expires_at > $2
          FOR UPDATE
        `,
        [tokenHash, verifiedAt],
      );

      const record = tokenResult.rows[0];

      if (!record) {
        return null;
      }

      await client.query(
        `
          UPDATE uaos_users
          SET email_verified_at = $2
          WHERE id = $1
        `,
        [record.user_id, verifiedAt],
      );

      await client.query(
        `
          DELETE FROM uaos_email_verification_tokens
          WHERE user_id = $1
        `,
        [record.user_id],
      );

      return this.findUserById(record.user_id, client);
    });
  }

  async createSession({
    id,
    userId,
    tokenHash,
    createdAt,
    expiresAt,
  }) {
    await this.pool.query(
      `
        INSERT INTO uaos_sessions (
          id,
          user_id,
          token_hash,
          created_at,
          expires_at
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [id, userId, tokenHash, createdAt, expiresAt],
    );
  }

  async findUserBySessionHash(tokenHash, now) {
    const result = await this.pool.query(
      `
        ${userSelect}
        INNER JOIN uaos_sessions AS sessions
          ON sessions.user_id = users.id
        WHERE sessions.token_hash = $1
          AND sessions.expires_at > $2
      `,
      [tokenHash, now],
    );

    return rowToUser(result.rows[0]);
  }

  async revokeSession(tokenHash) {
    const result = await this.pool.query(
      `
        DELETE FROM uaos_sessions
        WHERE token_hash = $1
      `,
      [tokenHash],
    );

    return result.rowCount > 0;
  }

  async replacePasswordResetToken({
    email,
    tokenHash,
    expiresAt,
  }) {
    return this.transaction(async (client) => {
      const userResult = await client.query(
        `
          SELECT id
          FROM uaos_users
          WHERE email = $1
          FOR UPDATE
        `,
        [email],
      );

      const user = userResult.rows[0];

      if (!user) {
        return null;
      }

      await client.query(
        `
          INSERT INTO uaos_password_reset_tokens (
            user_id,
            token_hash,
            expires_at
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id)
          DO UPDATE SET
            token_hash = EXCLUDED.token_hash,
            expires_at = EXCLUDED.expires_at
        `,
        [user.id, tokenHash, expiresAt],
      );

      return user.id;
    });
  }

  async consumePasswordResetToken({
    tokenHash,
    passwordHash,
    now,
  }) {
    return this.transaction(async (client) => {
      const tokenResult = await client.query(
        `
          SELECT user_id
          FROM uaos_password_reset_tokens
          WHERE token_hash = $1
            AND expires_at > $2
          FOR UPDATE
        `,
        [tokenHash, now],
      );

      const record = tokenResult.rows[0];

      if (!record) {
        return false;
      }

      await client.query(
        `
          UPDATE uaos_users
          SET password_hash = $2
          WHERE id = $1
        `,
        [record.user_id, passwordHash],
      );

      await client.query(
        `
          DELETE FROM uaos_password_reset_tokens
          WHERE user_id = $1
        `,
        [record.user_id],
      );

      await client.query(
        `
          DELETE FROM uaos_sessions
          WHERE user_id = $1
        `,
        [record.user_id],
      );

      return true;
    });
  }

  async upsertSubscription({
    email,
    planId,
    status,
    providerCustomerId,
    providerSubscriptionId,
    currentPeriodEnd,
    updatedAt,
  }) {
    return this.transaction(async (client) => {
      const userResult = await client.query(
        `
          SELECT id
          FROM uaos_users
          WHERE email = $1
          FOR UPDATE
        `,
        [email],
      );

      const user = userResult.rows[0];

      if (!user) {
        return null;
      }

      await client.query(
        `
          INSERT INTO uaos_subscriptions (
            user_id,
            plan_id,
            status,
            provider_customer_id,
            provider_subscription_id,
            current_period_end,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id)
          DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            status = EXCLUDED.status,
            provider_customer_id = EXCLUDED.provider_customer_id,
            provider_subscription_id = EXCLUDED.provider_subscription_id,
            current_period_end = EXCLUDED.current_period_end,
            updated_at = EXCLUDED.updated_at
        `,
        [
          user.id,
          planId,
          status,
          providerCustomerId,
          providerSubscriptionId,
          currentPeriodEnd,
          updatedAt,
        ],
      );

      return this.findUserById(user.id, client);
    });
  }
}