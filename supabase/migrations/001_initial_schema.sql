-- ============================================================
-- Asteria Freelance — Initial Schema Migration
-- Run via Supabase Dashboard > SQL Editor, or supabase db push
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id           uuid UNIQUE,                          -- links to Supabase Auth user
  name              text NOT NULL,
  email             text NOT NULL UNIQUE,
  role              text NOT NULL DEFAULT 'CLIENT'
                      CHECK (role IN ('CLIENT','FREELANCER','ADMIN')),
  image             text,
  bio               text,
  skills            text[]          DEFAULT '{}',
  wallet_balance    numeric(12,2)   NOT NULL DEFAULT 0,   -- maintained via ledger, read-only in app code
  verified_status   text            DEFAULT 'UNSUBMITTED'
                      CHECK (verified_status IN ('UNSUBMITTED','PENDING','APPROVED','REJECTED')),
  rating            numeric(3,1)    DEFAULT 5.0,
  review_count      integer         DEFAULT 0,
  created_at        timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX ON users(role);
CREATE INDEX ON users(verified_status);
CREATE INDEX ON users(email);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id      text        NOT NULL,                       -- references static gig data
  buyer_id    uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id   uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  status      text        NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('PENDING','ACTIVE','COMPLETED','CANCELLED')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON orders(buyer_id);
CREATE INDEX ON orders(seller_id);
CREATE INDEX ON orders(status);

-- ============================================================
-- MILESTONES (child table of orders — NOT a JSON blob)
-- ============================================================
CREATE TABLE IF NOT EXISTS milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  percentage  integer     NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount      numeric(12,2) NOT NULL CHECK (amount >= 0),
  status      text        NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','FUNDED','SUBMITTED','RELEASED')),
  position    integer     NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON milestones(order_id);
CREATE INDEX ON milestones(status);

-- Enforce: all milestones for an order must sum to 100%
-- (enforced in application layer via lib/ledger.ts validation)

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text        NOT NULL,
  category      text        NOT NULL,
  budget        numeric(12,2) NOT NULL CHECK (budget > 0),
  delivery_days integer     NOT NULL CHECK (delivery_days > 0),
  skills        text[]      DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'OPEN'
                  CHECK (status IN ('OPEN','IN_PROGRESS','COMPLETED','CLOSED')),
  client_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON jobs(client_id);
CREATE INDEX ON jobs(status);
CREATE INDEX ON jobs(category);

-- ============================================================
-- PROPOSALS
-- ============================================================
CREATE TABLE IF NOT EXISTS proposals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  freelancer_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter    text        NOT NULL,
  price           numeric(12,2) NOT NULL CHECK (price > 0),
  delivery_days   integer     NOT NULL CHECK (delivery_days > 0),
  status          text        NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','ACCEPTED','REJECTED')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, freelancer_id)                          -- one proposal per freelancer per job
);

CREATE INDEX ON proposals(job_id);
CREATE INDEX ON proposals(freelancer_id);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  gig_id          text,
  reviewer_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_name   text        NOT NULL,
  reviewer_image  text,
  rating          integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)                                       -- ONE review per completed order, enforced at DB level
);

CREATE INDEX ON reviews(freelancer_id);
CREATE INDEX ON reviews(reviewer_id);

-- ============================================================
-- REPORTS / DISPUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_name   text        NOT NULL,
  target_type     text        NOT NULL CHECK (target_type IN ('GIG','ORDER','USER','JOB')),
  target_id       text        NOT NULL,
  target_title    text        NOT NULL,
  reason          text        NOT NULL,
  description     text        NOT NULL,
  status          text        NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','PENDING_SECOND_APPROVAL','DISMISSED','RESOLVED')),
  resolution_admin_1_id  uuid REFERENCES users(id),       -- first admin to act (maker-checker)
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);

CREATE INDEX ON reports(status);
CREATE INDEX ON reports(reporter_id);

-- ============================================================
-- KYC VERIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS verifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name         text        NOT NULL,
  dob               text        NOT NULL,
  country           text        NOT NULL,
  document_type     text        NOT NULL,
  document_number   text        NOT NULL,
  id_front_path     text        NOT NULL,                  -- Supabase Storage path (NOT public URL)
  id_back_path      text        NOT NULL,
  selfie_path       text        NOT NULL,
  status            text        NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  rejection_reason  text,
  submitted_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid        REFERENCES users(id),
  UNIQUE (user_id)                                         -- one active verification per user
);

CREATE INDEX ON verifications(status);
CREATE INDEX ON verifications(user_id);

-- ============================================================
-- AUDIT LOGS (immutable — no UPDATE/DELETE via RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  admin_name  text        NOT NULL,
  action      text        NOT NULL,                        -- KYC_VIEWED, KYC_APPROVED, ESCROW_REFUND, etc.
  target_id   text,                                        -- flexible: report ID, verification ID, order ID
  details     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON audit_logs(admin_id, created_at DESC);
CREATE INDEX ON audit_logs(action);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       text        NOT NULL,
  msg_type      text        NOT NULL DEFAULT 'TEXT'
                  CHECK (msg_type IN ('TEXT','CUSTOM_OFFER','SYSTEM')),
  offer_data    jsonb,                                     -- for CUSTOM_OFFER type
  is_read       boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON messages(sender_id, created_at DESC);
CREATE INDEX ON messages(receiver_id, created_at DESC);
CREATE INDEX ON messages(receiver_id, is_read) WHERE is_read = false;

-- ============================================================
-- WALLET TRANSACTIONS (append-only ledger — Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_id        uuid        REFERENCES orders(id),
  milestone_id    uuid        REFERENCES milestones(id),
  type            text        NOT NULL
                    CHECK (type IN ('DEPOSIT','FUND_ESCROW','RELEASE','REFUND','PLATFORM_FEE','WITHDRAWAL')),
  amount          numeric(12,2) NOT NULL,                  -- positive = credit, negative = debit
  balance_after   numeric(12,2) NOT NULL,
  note            text,
  idempotency_key text        UNIQUE,                      -- prevents double-processing
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX ON wallet_transactions(order_id);
CREATE INDEX ON wallet_transactions(idempotency_key);

-- ============================================================
-- PROCESSED REQUESTS (idempotency store — Phase 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS processed_requests (
  idempotency_key text        PRIMARY KEY,
  endpoint        text        NOT NULL,
  user_id         uuid        REFERENCES users(id),
  result          jsonb       NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Auto-expire old idempotency records after 7 days (optional, requires pg_cron)
-- SELECT cron.schedule('cleanup-idempotency', '0 2 * * *',
--   'DELETE FROM processed_requests WHERE created_at < now() - interval ''7 days''');

-- ============================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- ============================================================
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_requests  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — Service role bypasses all (server-side only)
-- Direct client access is locked down
-- ============================================================

-- Users: can read own record; admins read all
CREATE POLICY "users_self_read"      ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "users_self_update"    ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Orders: buyer or seller can read their own orders
CREATE POLICY "orders_party_read"    ON orders FOR SELECT
  USING (buyer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
      OR seller_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Milestones: inherit order party access
CREATE POLICY "milestones_party_read" ON milestones FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE
      buyer_id  = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
      seller_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  ));

-- Jobs: public read; only client owner can modify
CREATE POLICY "jobs_public_read"     ON jobs FOR SELECT USING (true);
CREATE POLICY "jobs_owner_write"     ON jobs FOR INSERT WITH CHECK (
  client_id = (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Proposals: only involved parties can read
CREATE POLICY "proposals_party_read" ON proposals FOR SELECT
  USING (freelancer_id = (SELECT id FROM users WHERE auth_id = auth.uid())
      OR job_id IN (SELECT id FROM jobs WHERE client_id = (SELECT id FROM users WHERE auth_id = auth.uid())));

-- Reviews: public read
CREATE POLICY "reviews_public_read"  ON reviews FOR SELECT USING (true);

-- Reports: reporter can read own; admins read all (service role)
CREATE POLICY "reports_reporter_read" ON reports FOR SELECT
  USING (reporter_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Verifications: only submitting user can read own docs (admins via service role)
CREATE POLICY "verifications_self_read" ON verifications FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Audit logs: no direct client read (service role only)
CREATE POLICY "audit_logs_no_direct_client" ON audit_logs FOR SELECT USING (false);

-- Messages: only sender or receiver
CREATE POLICY "messages_party_read"  ON messages FOR SELECT
  USING (sender_id   = (SELECT id FROM users WHERE auth_id = auth.uid())
      OR receiver_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Wallet transactions: only own transactions
CREATE POLICY "wallet_tx_self_read"  ON wallet_transactions FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
