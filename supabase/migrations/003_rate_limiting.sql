-- ============================================================
-- Asteria Freelance — Review Integrity Constraint
-- ============================================================
-- UNIQUE (order_id) on reviews is already defined in 001_initial_schema.sql
-- This migration adds the rate-limiting table for Phase 5

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON rate_limit_log(user_id, endpoint, created_at DESC);

-- Auto-cleanup old rate limit entries (keep only last 10 minutes)
-- Run via pg_cron or Supabase Edge Function scheduler:
-- DELETE FROM rate_limit_log WHERE created_at < now() - interval '10 minutes';
