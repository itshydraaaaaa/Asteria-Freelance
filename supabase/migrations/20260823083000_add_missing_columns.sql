-- ═══════════════════════════════════════════════════════════════════
-- Asteria Database Migration: Complete Schema Synchronization
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- https://supabase.com/dashboard/project/tvuktwtartbqmggndinu/sql/new
-- ═══════════════════════════════════════════════════════════════════

-- 1. Synchronize "User" table columns
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "password"       TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedStatus" TEXT NOT NULL DEFAULT 'UNSUBMITTED',
  ADD COLUMN IF NOT EXISTS "rating"         FLOAT NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS "reviewCount"    INTEGER NOT NULL DEFAULT 0;

-- Backfill: admins are pre-approved
UPDATE "User" SET "verifiedStatus" = 'APPROVED' WHERE role = 'ADMIN';

-- 2. Synchronize "Gig" table columns
ALTER TABLE "Gig"
  ADD COLUMN IF NOT EXISTS "status"      TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "rating"      FLOAT NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "gallery"     TEXT[];

-- 3. Synchronize "Order" table columns
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "escrowStatus"            TEXT NOT NULL DEFAULT 'HELD',
  ADD COLUMN IF NOT EXISTS "deliveryNote"            TEXT,
  ADD COLUMN IF NOT EXISTS "disputeReason"           TEXT,
  ADD COLUMN IF NOT EXISTS "requiresSecondApproval"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "updatedAt"               TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4. Synchronize "Message" table columns (adds receiverId, msgType, offerData, isRead)
ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "receiverId"  TEXT,
  ADD COLUMN IF NOT EXISTS "msgType"     TEXT NOT NULL DEFAULT 'TEXT',
  ADD COLUMN IF NOT EXISTS "offerData"   JSONB,
  ADD COLUMN IF NOT EXISTS "isRead"      BOOLEAN NOT NULL DEFAULT false;

-- 5. Synchronize "Notification" table columns
ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "link"   TEXT,
  ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;

-- 6. Synchronize "Proposal" table columns
ALTER TABLE "Proposal"
  ADD COLUMN IF NOT EXISTS "deliveryDays" INTEGER NOT NULL DEFAULT 3;

-- 7. Synchronize "Review" table columns
ALTER TABLE "Review"
  ADD COLUMN IF NOT EXISTS "authorId" TEXT,
  ADD COLUMN IF NOT EXISTS "orderId"  TEXT;

-- 8. Synchronize "Verification" table columns
ALTER TABLE "Verification"
  ADD COLUMN IF NOT EXISTS "fullName"        TEXT,
  ADD COLUMN IF NOT EXISTS "dob"             TEXT,
  ADD COLUMN IF NOT EXISTS "country"         TEXT,
  ADD COLUMN IF NOT EXISTS "documentType"    TEXT,
  ADD COLUMN IF NOT EXISTS "documentNumber"  TEXT,
  ADD COLUMN IF NOT EXISTS "idFrontPath"     TEXT,
  ADD COLUMN IF NOT EXISTS "idBackPath"      TEXT,
  ADD COLUMN IF NOT EXISTS "selfiePath"      TEXT,
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedBy"      TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "submittedAt"     TIMESTAMPTZ DEFAULT now();

-- 9. Create "Milestone" table if not exists (orderId is UUID matching Order.id)
CREATE TABLE IF NOT EXISTS "Milestone" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId"    UUID NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "title"      TEXT NOT NULL,
  "percentage" INTEGER NOT NULL DEFAULT 100,
  "amount"     FLOAT NOT NULL DEFAULT 0,
  "status"     TEXT NOT NULL DEFAULT 'PENDING',
  "position"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Create "AuditLog" table if not exists
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminId"   TEXT NOT NULL,
  "adminName" TEXT NOT NULL DEFAULT '',
  "action"    TEXT NOT NULL,
  "targetId"  TEXT,
  "details"   TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 11. Enable Row Level Security (RLS) on all tables
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE "User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Gig"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposal"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"     ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- 12. Security & RLS Policies
-- ═══════════════════════════════════════════════════════════════════

-- User policies
DROP POLICY IF EXISTS "public_read_users" ON "User";
CREATE POLICY "public_read_users" ON "User"
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "users_update_own" ON "User";
CREATE POLICY "users_update_own" ON "User"
  FOR UPDATE TO authenticated
  USING ((select auth.uid())::text = id::text)
  WITH CHECK ((select auth.uid())::text = id::text);

-- Gig policies
DROP POLICY IF EXISTS "public_read_gigs" ON "Gig";
CREATE POLICY "public_read_gigs" ON "Gig"
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_write_gigs" ON "Gig";
CREATE POLICY "owner_write_gigs" ON "Gig"
  FOR ALL TO authenticated
  USING ((select auth.uid())::text = "freelancerId"::text)
  WITH CHECK ((select auth.uid())::text = "freelancerId"::text);

-- Job policies
DROP POLICY IF EXISTS "public_read_jobs" ON "Job";
CREATE POLICY "public_read_jobs" ON "Job"
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_write_jobs" ON "Job";
CREATE POLICY "owner_write_jobs" ON "Job"
  FOR ALL TO authenticated
  USING ((select auth.uid())::text = "clientId"::text)
  WITH CHECK ((select auth.uid())::text = "clientId"::text);

-- Order policies
DROP POLICY IF EXISTS "party_read_orders" ON "Order";
CREATE POLICY "party_read_orders" ON "Order"
  FOR SELECT TO authenticated
  USING (
    (select auth.uid())::text = "buyerId"::text OR
    (select auth.uid())::text = "sellerId"::text
  );

-- Notification policies
DROP POLICY IF EXISTS "own_notifications" ON "Notification";
CREATE POLICY "own_notifications" ON "Notification"
  FOR SELECT TO authenticated
  USING ((select auth.uid())::text = "userId"::text);

-- Review policies
DROP POLICY IF EXISTS "public_read_reviews" ON "Review";
CREATE POLICY "public_read_reviews" ON "Review"
  FOR SELECT TO anon, authenticated USING (true);

-- Proposal policies
DROP POLICY IF EXISTS "proposal_access" ON "Proposal";
CREATE POLICY "proposal_access" ON "Proposal"
  FOR SELECT TO authenticated
  USING ((select auth.uid())::text = "freelancerId"::text);

-- Message policies
DROP POLICY IF EXISTS "message_parties" ON "Message";
CREATE POLICY "message_parties" ON "Message"
  FOR SELECT TO authenticated
  USING (
    (select auth.uid())::text = "senderId"::text OR
    (select auth.uid())::text = "receiverId"::text
  );

-- Milestone policies
DROP POLICY IF EXISTS "milestone_access" ON "Milestone";
CREATE POLICY "milestone_access" ON "Milestone"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Order" o
      WHERE o.id = "Milestone"."orderId"
        AND ((select auth.uid())::text = o."buyerId"::text
          OR (select auth.uid())::text = o."sellerId"::text)
    )
  );

-- Verification policies
DROP POLICY IF EXISTS "own_verification" ON "Verification";
CREATE POLICY "own_verification" ON "Verification"
  FOR SELECT TO authenticated
  USING ((select auth.uid())::text = "userId"::text);

-- AuditLog policies (service role only)
DROP POLICY IF EXISTS "no_client_auditlog" ON "AuditLog";
CREATE POLICY "no_client_auditlog" ON "AuditLog"
  FOR SELECT TO authenticated USING (false);
