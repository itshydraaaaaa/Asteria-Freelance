/**
 * __tests__/phase1_persistence_consolidation.test.ts
 *
 * Comprehensive regression tests for Phase 1:
 * - Database & Persistence Consolidation
 * - Platform Treasury UUID normalization (no string 'platform' UUID crash)
 * - Milestone, Dispute Report, Withdrawal, Message, and Notification persistence
 * - Migration 005_consolidate_schema.sql DDL integrity
 */

import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import {
  PLATFORM_TREASURY_USER_ID,
  PLATFORM_RESERVE_ID,
  canonicalizeUserId,
  processEscrowRelease,
  processMilestoneRelease,
  getBalance,
} from '@/lib/ledger'

describe('Phase 1: Persistence Consolidation & Treasury UUID Normalization', () => {
  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // ─── Task 1: Treasury UUID Normalization ─────────────────────────────────────
  describe('Task 1: Treasury Account RFC 4122 UUID Conformance', () => {
    it('defines PLATFORM_TREASURY_USER_ID as a valid RFC 4122 UUID', () => {
      expect(PLATFORM_TREASURY_USER_ID).toMatch(UUID_V4_REGEX)
      expect(PLATFORM_RESERVE_ID).toBe(PLATFORM_TREASURY_USER_ID)
    })

    it('canonicalizes string literal "platform" to PLATFORM_TREASURY_USER_ID', () => {
      expect(canonicalizeUserId('platform')).toBe(PLATFORM_TREASURY_USER_ID)
    })

    it('canonicalizes nil UUID "00000000-0000-0000-0000-000000000000" to PLATFORM_TREASURY_USER_ID', () => {
      expect(canonicalizeUserId('00000000-0000-0000-0000-000000000000')).toBe(PLATFORM_TREASURY_USER_ID)
    })

    it('preserves valid client/freelancer UUIDs without alteration', () => {
      const regularUserId = '11111111-2222-3333-4444-555555555555'
      expect(canonicalizeUserId(regularUserId)).toBe(regularUserId)
    })

    it('processes escrow release using canonical treasury UUID without error', async () => {
      const sellerId = 'seller_test_uuid_p1'
      const res = await processEscrowRelease('ord_escrow_p1', sellerId, 500)

      expect(res.sellerPayout).toBe(440) // 88%
      expect(res.platformFee).toBe(60)   // 12%
    })

    it('processes escrow release when adminId is explicitly "platform"', async () => {
      const sellerId = 'seller_test_uuid_p2'
      const res = await processEscrowRelease('ord_escrow_p2', sellerId, 1000, 'platform')

      expect(res.sellerPayout).toBe(880) // 88%
      expect(res.platformFee).toBe(120)  // 12%
    })

    it('processes milestone release using canonical treasury UUID', async () => {
      const sellerId = 'seller_test_uuid_p3'
      const res = await processMilestoneRelease('ord_ms_p1', 'ms_test_1', sellerId, 250)

      expect(res.sellerPayout).toBe(220) // 88%
      expect(res.platformFee).toBe(30)   // 12%
    })
  })

  // ─── Task 2: Milestone Entity Persistence ───────────────────────────────────
  describe('Task 2: Milestone Data Access Layer (db.milestone)', () => {
    it('creates, retrieves, and updates multi-stage milestones', async () => {
      const orderId = 'ord_ms_order_test_1'

      // 1. Create milestone 1
      const m1 = await db.milestone.create({
        data: {
          orderId,
          title: 'Design Wireframes',
          percentage: 40,
          amount: 200,
          position: 1,
        },
      })
      expect(m1.id).toBeDefined()
      expect(m1.status).toBe('PENDING')
      expect(m1.percentage).toBe(40)

      // 2. Create milestone 2
      const m2 = await db.milestone.create({
        data: {
          orderId,
          title: 'Frontend Implementation',
          percentage: 60,
          amount: 300,
          position: 2,
        },
      })

      // 3. Find many by orderId
      const milestones = await db.milestone.findMany({ where: { orderId } })
      expect(milestones.length).toBe(2)
      expect(milestones[0].position).toBe(1)
      expect(milestones[1].position).toBe(2)

      // 4. Find unique
      const found = await db.milestone.findUnique({ where: { id: m1.id } })
      expect(found).not.toBeNull()
      expect(found?.title).toBe('Design Wireframes')

      // 5. Update milestone
      const updated = await db.milestone.update({
        where: { id: m1.id },
        data: { status: 'SUBMITTED' },
      })
      expect(updated?.status).toBe('SUBMITTED')
    })
  })

  // ─── Task 3: Dispute & Report Entity Persistence ────────────────────────────
  describe('Task 3: Dispute Report Data Access Layer (db.report)', () => {
    it('creates, retrieves, and updates dispute reports', async () => {
      const reporterId = 'client_reporter_1'
      const report = await db.report.create({
        data: {
          reporterId,
          reporterName: 'Alice Johnson',
          targetType: 'ORDER',
          targetId: 'ord_disputed_1',
          targetTitle: 'Full-Stack SaaS Web App',
          reason: 'Incomplete Deliverables',
          description: 'Freelancer missed 2 critical database requirements.',
        },
      })

      expect(report.id).toBeDefined()
      expect(report.reason).toBe('Incomplete Deliverables')

      const allReports = await db.report.findMany()
      expect(allReports.some(r => r.id === report.id)).toBe(true)

      const single = await db.report.findUnique({ where: { id: report.id } })
      expect(single).not.toBeNull()
      expect(single?.reporterName).toBe('Alice Johnson')

      const updated = await db.report.update({
        where: { id: report.id },
        data: { status: 'RESOLVED' },
      })
      expect(updated?.status).toBe('RESOLVED')
    })
  })

  // ─── Task 4: Withdrawal Entity Persistence ──────────────────────────────────
  describe('Task 4: Withdrawal Data Access Layer (db.withdrawal)', () => {
    it('creates, filters, and processes withdrawal payout requests', async () => {
      const userId = 'freelancer_payout_user_1'

      const wth = await db.withdrawal.create({
        data: {
          userId,
          amount: 350,
          method: 'BANK_RIB',
          accountDetails: { rib: '08123456789012345678', bankName: 'BIAT' },
          status: 'PENDING',
        },
      })

      expect(wth.id).toBeDefined()
      expect(wth.amount).toBe(350)
      expect(wth.status).toBe('PENDING')

      const userPending = await db.withdrawal.findMany({ where: { userId, status: 'PENDING' } })
      expect(userPending.some(w => w.id === wth.id)).toBe(true)

      const approved = await db.withdrawal.update({
        where: { id: wth.id },
        data: {
          status: 'APPROVED',
          adminNotes: 'Transferred via BIAT RIB batch #9041',
          reviewedBy: 'admin_maker_1',
        },
      })
      expect(approved?.status).toBe('APPROVED')
      expect(approved?.adminNotes).toContain('BIAT RIB')
    })
  })

  // ─── Task 5: Message & Chat Entity Persistence ──────────────────────────────
  describe('Task 5: Message Data Access Layer (db.message)', () => {
    it('creates and retrieves peer-to-peer chat messages', async () => {
      const senderId = 'client_chat_user_1'
      const receiverId = 'freelancer_chat_user_2'

      const msg1 = await db.message.create({
        data: {
          senderId,
          receiverId,
          content: 'Hello, could you clarify the API documentation deliverable?',
          msgType: 'TEXT',
        },
      })

      const msg2 = await db.message.create({
        data: {
          senderId: receiverId,
          receiverId: senderId,
          content: 'Sure! I will provide OpenAPI 3.1 YAML specifications.',
          msgType: 'TEXT',
        },
      })

      expect(msg1.id).toBeDefined()
      expect(msg2.id).toBeDefined()

      const clientConvo = await db.message.findMany({ where: { userId: senderId } })
      expect(clientConvo.some(m => m.id === msg1.id)).toBe(true)
      expect(clientConvo.some(m => m.id === msg2.id)).toBe(true)
    })
  })

  // ─── Task 6: Notification Entity Persistence ────────────────────────────────
  describe('Task 6: Notification Data Access Layer (db.notification)', () => {
    it('creates notifications and performs markAllAsRead batch update', async () => {
      const userId = 'notif_user_target_1'

      const n1 = await db.notification.create({
        data: {
          userId,
          title: 'Order Funded',
          message: 'Client deposited 500 TND into escrow.',
          type: 'ORDER',
          link: '/dashboard/orders/ord_123',
        },
      })

      const n2 = await db.notification.create({
        data: {
          userId,
          title: 'KYC Approved',
          message: 'Your identity documents have been verified.',
          type: 'KYC',
          link: '/dashboard/profile',
        },
      })

      expect(n1.isRead).toBe(false)
      expect(n2.isRead).toBe(false)

      const unreadList = await db.notification.findMany({ where: { userId, isRead: false } })
      expect(unreadList.length).toBeGreaterThanOrEqual(2)

      const markedCount = await db.notification.markAllAsRead(userId)
      expect(markedCount).toBeGreaterThanOrEqual(2)

      const unreadAfter = await db.notification.findMany({ where: { userId, isRead: false } })
      expect(unreadAfter.length).toBe(0)
    })
  })

  // ─── Task 7: Migration 005 Integrity & Security ─────────────────────────────
  describe('Task 7: Migration 005 Canonical Schema & RLS Lockdown', () => {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/005_consolidate_schema.sql')

    it('verifies 005_consolidate_schema.sql exists', () => {
      expect(fs.existsSync(migrationPath)).toBe(true)
    })

    it('verifies canonical tables are declared in migration 005', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8')

      expect(sql).toContain('CREATE TABLE IF NOT EXISTS milestones')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS "Milestone"')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS reports')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS disputes')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS withdrawals')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS messages')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS "Message"')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS notifications')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS "Notification"')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS idempotency_keys')
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS processed_requests')
    })

    it('verifies Platform Reserve Treasury account is seeded with valid UUID', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8')

      expect(sql).toContain('00000000-0000-0000-0000-000000000000')
      expect(sql).toContain('treasury@asteria.local')
      expect(sql).toContain('Asteria Platform Reserve')
    })

    it('verifies composite B-tree indexes are declared in migration 005', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8')

      expect(sql).toContain('idx_orders_client_status')
      expect(sql).toContain('idx_orders_seller_status')
      expect(sql).toContain('idx_messages_order_created')
      expect(sql).toContain('idx_notifications_user_unread')
    })

    it('verifies insecure open policies are dropped and replaced with row-owner RLS', () => {
      const sql = fs.readFileSync(migrationPath, 'utf-8')

      // Drops open bypasses
      expect(sql).toContain('DROP POLICY IF EXISTS "allow_all_users" ON "User"')
      expect(sql).toContain('DROP POLICY IF EXISTS "allow_all_orders" ON "Order"')
      expect(sql).toContain('DROP POLICY IF EXISTS "allow_all_verification" ON "Verification"')

      // Enables row-level security
      expect(sql).toContain('ALTER TABLE "User" ENABLE ROW LEVEL SECURITY')
      expect(sql).toContain('ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY')
      expect(sql).toContain('ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY')

      // Restricts mutations to row owner
      expect(sql).toContain('auth.uid()')
    })
  })
})
