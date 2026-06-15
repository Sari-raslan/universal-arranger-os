BEGIN;

ALTER TABLE uaos_users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uaos_users_stripe_customer_idx
  ON uaos_users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS uaos_payment_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing','completed','failed')),
  user_id UUID NULL REFERENCES uaos_users(id) ON DELETE SET NULL,
  error_message TEXT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL
);

COMMIT;