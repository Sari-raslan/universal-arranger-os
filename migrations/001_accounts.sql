BEGIN;

CREATE TABLE IF NOT EXISTS uaos_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  email_verified_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS uaos_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES uaos_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS uaos_sessions_user_idx
  ON uaos_sessions(user_id);

CREATE INDEX IF NOT EXISTS uaos_sessions_expiry_idx
  ON uaos_sessions(expires_at);

CREATE TABLE IF NOT EXISTS uaos_email_verification_tokens (
  user_id UUID PRIMARY KEY REFERENCES uaos_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS uaos_password_reset_tokens (
  user_id UUID PRIMARY KEY REFERENCES uaos_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS uaos_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES uaos_users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_customer_id TEXT NULL,
  provider_subscription_id TEXT NULL,
  current_period_end TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT uaos_subscription_plan_check
    CHECK (plan_id IN ('creator', 'professional')),
  CONSTRAINT uaos_subscription_status_check
    CHECK (status IN ('active', 'past_due', 'cancelled', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uaos_subscription_provider_idx
  ON uaos_subscriptions(provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

COMMIT;