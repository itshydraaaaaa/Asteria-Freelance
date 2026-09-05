-- ============================================================================
-- ASTERIA FREELANCE — PHASE 1 CANONICAL SCHEMA & PERSISTENCE CONSOLIDATION
-- Migration 005_consolidate_schema.sql
-- ============================================================================

-- Enable essential cryptographic & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CANONICAL TABLES & PERSISTENCE CONSOLIDATION
-- ============================================================================

-- 1.1 USERS & WALLETS
-- Ensure canonical wallets table exists for double-entry financial ledger
CREATE TABLE IF NOT EXISTS wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE,
  balance     NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
  currency    VARCHAR(3) NOT NULL DEFAULT 'TND',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 MILESTONES (Persistent table for multi-stage project deliverables)
CREATE TABLE IF NOT EXISTS "Milestone" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"    TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "percentage" INTEGER NOT NULL DEFAULT 100,
  "amount"     FLOAT NOT NULL DEFAULT 0,
  "status"     TEXT NOT NULL DEFAULT 'PENDING',
  "position"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID,
  title       TEXT NOT NULL,
  percentage  INTEGER NOT NULL DEFAULT 100,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status      TEXT NOT NULL DEFAULT 'PENDING',
  position    INTEGER NOT NULL DEFAULT 0,
  due_date    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 DISPUTES & REPORTS (Persistent dispute resolution records)
CREATE TABLE IF NOT EXISTS reports (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id            TEXT NOT NULL,
  reporter_name          TEXT NOT NULL DEFAULT 'User',
  target_type            TEXT NOT NULL DEFAULT 'ORDER',
  target_id              TEXT NOT NULL DEFAULT '',
  target_title           TEXT NOT NULL DEFAULT 'Report',
  reason                 TEXT NOT NULL,
  description            TEXT NOT NULL DEFAULT '',
  status                 TEXT NOT NULL DEFAULT 'PENDING',
  resolution_notes       TEXT,
  resolved_by            TEXT,
  resolved_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disputes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         TEXT,
  reporter_id      TEXT NOT NULL,
  reason           TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'OPEN',
  resolution_notes TEXT,
  resolved_by      TEXT,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 WITHDRAWALS & PAYOUT REQUESTS
CREATE TABLE IF NOT EXISTS withdrawals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT NOT NULL,
  amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method             TEXT NOT NULL DEFAULT 'BANK_RIB',
  account_details    JSONB,
  status             TEXT NOT NULL DEFAULT 'PENDING',
  maker_admin_id     TEXT,
  maker_admin_name   TEXT,
  checker_admin_id   TEXT,
  checker_admin_name TEXT,
  admin_notes        TEXT,
  reviewed_by        TEXT,
  processed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 MESSAGES (Persistent project chat & communication)
CREATE TABLE IF NOT EXISTS "Message" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" TEXT,
  "orderId"        TEXT,
  "senderId"       TEXT NOT NULL,
  "receiverId"     TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "msgType"        TEXT NOT NULL DEFAULT 'TEXT',
  "offerData"      JSONB,
  "isRead"         BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      TEXT,
  sender_id     TEXT NOT NULL,
  receiver_id   TEXT NOT NULL,
  content       TEXT NOT NULL,
  msg_type      TEXT NOT NULL DEFAULT 'TEXT',
  offer_data    JSONB,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.6 NOTIFICATIONS (Persistent user alerts)
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    TEXT NOT NULL,
  "type"      TEXT NOT NULL DEFAULT 'SYSTEM',
  "title"     TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "link"      TEXT,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'SYSTEM',
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.7 IDEMPOTENCY KEYS & PROCESSED REQUESTS (Serverless double-spend prevention)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key         TEXT PRIMARY KEY,
  endpoint    TEXT NOT NULL DEFAULT '',
  user_id     TEXT,
  response    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS processed_requests (
  idempotency_key TEXT PRIMARY KEY,
  endpoint        TEXT NOT NULL DEFAULT '',
  user_id         TEXT,
  result          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. SEED PLATFORM RESERVE TREASURY ACCOUNT & WALLET
-- ============================================================================

-- Seed dedicated Platform Reserve Treasury account in "User"
INSERT INTO "User" (id, email, name, role, "walletBalance", "verifiedStatus")
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'treasury@asteria.local',
  'Asteria Platform Reserve',
  'ADMIN',
  0.00,
  'APPROVED'
)
ON CONFLICT (id) DO UPDATE
SET name = 'Asteria Platform Reserve', role = 'ADMIN';

-- Seed in users if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    INSERT INTO users (id, email, full_name, role, wallet_balance, verified_status)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      'treasury@asteria.local',
      'Asteria Platform Reserve',
      'ADMIN',
      0.00,
      'APPROVED'
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = 'Asteria Platform Reserve', role = 'ADMIN';
  END IF;
END $$;

-- Seed Platform Treasury Wallet in wallets
INSERT INTO wallets (id, user_id, balance, currency)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  0.00,
  'TND'
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 3. COMPOSITE B-TREE INDEXES FOR HIGH TRAFFIC PATHS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_client_status ON "Order"("buyerId", "status");
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON "Order"("sellerId", "status");
CREATE INDEX IF NOT EXISTS idx_messages_order_created ON "Message"("orderId", "createdAt" ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON "Notification"("userId") WHERE "isRead" = false;
CREATE INDEX IF NOT EXISTS idx_milestones_order ON "Milestone"("orderId");
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals("user_id", "status");
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports("status");
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys("expires_at");

-- ============================================================================
-- 4. HARDEN ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- 4.1 Drop Insecure Universal Open Policies from earlier migrations
DROP POLICY IF EXISTS "allow_all_verification" ON "Verification";
DROP POLICY IF EXISTS "allow_all_users" ON "User";
DROP POLICY IF EXISTS "allow_all_gigs" ON "Gig";
DROP POLICY IF EXISTS "allow_all_jobs" ON "Job";
DROP POLICY IF EXISTS "allow_all_orders" ON "Order";
DROP POLICY IF EXISTS "allow_all_milestones" ON "Milestone";
DROP POLICY IF EXISTS "allow_all_proposals" ON "Proposal";
DROP POLICY IF EXISTS "allow_all_messages" ON "Message";
DROP POLICY IF EXISTS "allow_all_notifications" ON "Notification";
DROP POLICY IF EXISTS "allow_all_reviews" ON "Review";
DROP POLICY IF EXISTS "allow_all_auditlog" ON "AuditLog";
DROP POLICY IF EXISTS "Allow all operations for anon" ON "User";
DROP POLICY IF EXISTS "Allow all operations for anon" ON "Order";
DROP POLICY IF EXISTS "Allow all operations for anon" ON "Wallet";

-- 4.2 Enable RLS on all persistent tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Gig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_requests ENABLE ROW LEVEL SECURITY;

-- 4.3 Production Row-Owner & Least-Privilege Policies

-- Users: Public profiles readable, write restricted to self
DROP POLICY IF EXISTS "users_public_read" ON "User";
CREATE POLICY "users_public_read" ON "User" FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_self_update" ON "User";
CREATE POLICY "users_self_update" ON "User" FOR UPDATE USING (auth.uid()::text = id::text);

-- Gigs: Public catalog readable, write restricted to freelancer owner
DROP POLICY IF EXISTS "gigs_public_read" ON "Gig";
CREATE POLICY "gigs_public_read" ON "Gig" FOR SELECT USING (true);

DROP POLICY IF EXISTS "gigs_owner_write" ON "Gig";
CREATE POLICY "gigs_owner_write" ON "Gig" FOR ALL USING (auth.uid()::text = "freelancerId"::text);

-- Jobs: Public marketplace readable, write restricted to client owner
DROP POLICY IF EXISTS "jobs_public_read" ON "Job";
CREATE POLICY "jobs_public_read" ON "Job" FOR SELECT USING (true);

DROP POLICY IF EXISTS "jobs_owner_write" ON "Job";
CREATE POLICY "jobs_owner_write" ON "Job" FOR ALL USING (auth.uid()::text = "clientId"::text);

-- Orders: Viewable only by involved buyer or seller
DROP POLICY IF EXISTS "orders_party_read" ON "Order";
CREATE POLICY "orders_party_read" ON "Order" FOR SELECT
  USING (auth.uid()::text = "buyerId"::text OR auth.uid()::text = "sellerId"::text);

-- Messages: Viewable only by sender or recipient
DROP POLICY IF EXISTS "messages_party_read" ON "Message";
CREATE POLICY "messages_party_read" ON "Message" FOR SELECT
  USING (auth.uid()::text = "senderId"::text OR auth.uid()::text = "receiverId"::text);

DROP POLICY IF EXISTS "messages_sender_insert" ON "Message";
CREATE POLICY "messages_sender_insert" ON "Message" FOR INSERT
  WITH CHECK (auth.uid()::text = "senderId"::text);

-- Notifications: Strictly private to recipient
DROP POLICY IF EXISTS "notifications_self_read" ON "Notification";
CREATE POLICY "notifications_self_read" ON "Notification" FOR SELECT
  USING (auth.uid()::text = "userId"::text);

DROP POLICY IF EXISTS "notifications_self_update" ON "Notification";
CREATE POLICY "notifications_self_update" ON "Notification" FOR UPDATE
  USING (auth.uid()::text = "userId"::text);

-- Wallets: Viewable only by account owner; NO direct client mutation
DROP POLICY IF EXISTS "wallets_self_read" ON wallets;
CREATE POLICY "wallets_self_read" ON wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Withdrawals: Viewable only by requesting user
DROP POLICY IF EXISTS "withdrawals_self_read" ON withdrawals;
CREATE POLICY "withdrawals_self_read" ON withdrawals FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Reports: Viewable only by reporter
DROP POLICY IF EXISTS "reports_self_read" ON reports;
CREATE POLICY "reports_self_read" ON reports FOR SELECT
  USING (auth.uid()::text = reporter_id::text);

-- Verifications: KYC documents strictly private to applicant
DROP POLICY IF EXISTS "verifications_self_read" ON "Verification";
CREATE POLICY "verifications_self_read" ON "Verification" FOR SELECT
  USING (auth.uid()::text = "userId"::text);

-- Reviews: Publicly viewable
DROP POLICY IF EXISTS "reviews_public_read" ON "Review";
CREATE POLICY "reviews_public_read" ON "Review" FOR SELECT USING (true);

-- Audit logs: Zero direct client access (accessible only via service role key)
DROP POLICY IF EXISTS "audit_logs_no_client" ON "AuditLog";
CREATE POLICY "audit_logs_no_client" ON "AuditLog" FOR ALL USING (false);
