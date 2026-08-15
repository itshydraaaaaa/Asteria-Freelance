-- ============================================================
-- Asteria Freelance — Withdrawals & Payout Requests
-- Migration 004
-- ============================================================

CREATE TABLE IF NOT EXISTS withdrawals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount           numeric(12,2) NOT NULL CHECK (amount >= 20),
  method           text NOT NULL, -- 'Flouci', 'Tunisian Bank Transfer (RIB)', 'Stripe', 'Wise', 'PayPal'
  account_details  text NOT NULL, -- RIB number, Flouci phone, or email
  status           text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  admin_notes      text,
  processed_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  processed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON withdrawals(user_id);
CREATE INDEX ON withdrawals(status);
CREATE INDEX ON withdrawals(created_at DESC);
