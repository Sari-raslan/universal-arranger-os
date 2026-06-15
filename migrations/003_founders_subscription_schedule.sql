BEGIN;

ALTER TABLE uaos_subscriptions
  ADD COLUMN IF NOT EXISTS provider_schedule_id TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  uaos_subscriptions_provider_schedule_idx
  ON uaos_subscriptions(provider_schedule_id)
  WHERE provider_schedule_id IS NOT NULL;

COMMIT;

