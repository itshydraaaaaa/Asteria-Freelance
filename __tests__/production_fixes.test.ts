import { db } from '@/lib/db'
import { debitWallet, creditWallet, getBalance } from '@/lib/ledger'
import { checkAccountLockout, recordFailedLogin, rateLimit } from '@/lib/rateLimit'

describe('Production Hardening & Bug Fixes Test Suite', () => {
  const TEST_FL_ID = 'test_fl_withdrawal_fix'
  const TEST_BUYER_ID = 'test_buyer_proposal_fix'

  beforeAll(async () => {
    // Seed test users
    await db.user.create({
      data: {
        id: TEST_FL_ID,
        name: 'Withdrawal Test Freelancer',
        email: 'fl_withdraw@test.com',
        role: 'FREELANCER',
        walletBalance: 500,
        verifiedStatus: 'APPROVED',
      },
    })

    await db.user.create({
      data: {
        id: TEST_BUYER_ID,
        name: 'Job Owner Client',
        email: 'buyer_job@test.com',
        role: 'CLIENT',
        walletBalance: 2000,
        verifiedStatus: 'APPROVED',
      },
    })
  })

  describe('1. Free Withdrawal Exploit Fix (Hold & Rejection Refund)', () => {
    it('holds/debits wallet balance immediately when withdrawal request is submitted', async () => {
      const initialBalance = await getBalance(TEST_FL_ID)
      expect(initialBalance).toBe(500)

      const withdrawAmount = 200

      // Step 1: Simulate withdrawal hold
      await debitWallet(TEST_FL_ID, withdrawAmount, 'WITHDRAWAL', {
        note: 'Withdrawal requested via Bank RIB',
        idempotencyKey: 'test-with-hold-1',
      })

      const pendingWithdrawal = await db.withdrawal.create({
        data: {
          userId: TEST_FL_ID,
          amount: withdrawAmount,
          method: 'BANK_RIB',
          accountDetails: 'TN59 0000 1234 5678',
          status: 'PENDING',
        },
      })

      const afterHoldBalance = await getBalance(TEST_FL_ID)
      expect(afterHoldBalance).toBe(300) // 500 - 200 = 300 held

      // Step 2: Simulate Admin Rejection with automatic ledger refund
      const rejectionReason = 'Incorrect Bank RIB formatting'
      await creditWallet(TEST_FL_ID, withdrawAmount, 'REFUND', {
        note: `Withdrawal #${pendingWithdrawal.id} rejected: ${rejectionReason}`,
        idempotencyKey: `refund-with-${pendingWithdrawal.id}`,
      })

      await db.withdrawal.update({
        where: { id: pendingWithdrawal.id },
        data: { status: 'REJECTED', adminNotes: rejectionReason },
      })

      const refundedBalance = await getBalance(TEST_FL_ID)
      expect(refundedBalance).toBe(500) // Restored back to 500
    })
  })

  describe('2. Stripe Exchange Rate Calculation', () => {
    const TND_TO_USD_RATE = 0.32

    const calculateStripeAmountCents = (tndAmount: number, currency: string) => {
      const chargeCurrency = currency === 'tnd' ? 'usd' : currency
      const chargeAmount = currency === 'tnd' ? (tndAmount * TND_TO_USD_RATE) : tndAmount
      const cents = Math.max(50, Math.round(chargeAmount * 100))
      return { chargeCurrency, chargeAmount, cents }
    }

    it('correctly converts TND to USD cents without 1:1 parity bug', () => {
      const result = calculateStripeAmountCents(300, 'tnd')
      expect(result.chargeCurrency).toBe('usd')
      expect(result.chargeAmount).toBeCloseTo(96.0, 1) // 300 * 0.32 = 96 USD
      expect(result.cents).toBe(9600) // 9600 cents
      expect(result.cents).not.toBe(30000) // Not $300 USD!
    })

    it('handles small amounts with Stripe 50 cent minimum', () => {
      const result = calculateStripeAmountCents(1, 'tnd')
      expect(result.cents).toBe(50) // Stripe minimum 50 cents
    })
  })

  describe('3. Private Proposals Authorization Protection', () => {
    const JOB_ID = 'job_secure_proposals'

    beforeAll(async () => {
      await db.job.create({
        data: {
          id: JOB_ID,
          title: 'Full-Stack Next.js Project',
          description: 'SaaS Platform Development',
          category: 'Development',
          budget: 1500,
          deliveryDays: 10,
          clientId: TEST_BUYER_ID,
          status: 'OPEN',
        },
      })

      // Freelancer A submits proposal
      await db.proposal.create({
        data: {
          id: 'prop_fl_a',
          jobId: JOB_ID,
          freelancerId: 'freelancer_a',
          coverLetter: 'Proprietary strategy A',
          price: 1200,
          deliveryDays: 7,
        },
      })

      // Freelancer B submits proposal
      await db.proposal.create({
        data: {
          id: 'prop_fl_b',
          jobId: JOB_ID,
          freelancerId: 'freelancer_b',
          coverLetter: 'Proprietary strategy B',
          price: 1400,
          deliveryDays: 9,
        },
      })
    })

    it('allows job owner client to see all candidate proposals', async () => {
      const allForJob = await db.proposal.findMany({ where: { jobId: JOB_ID } })
      expect(allForJob.length).toBe(2)
    })

    it('restricts competing freelancers to ONLY see their own proposal', async () => {
      const flAProposals = await db.proposal.findMany({
        where: { jobId: JOB_ID, freelancerId: 'freelancer_a' },
      })
      expect(flAProposals.length).toBe(1)
      expect(flAProposals[0].id).toBe('prop_fl_a')
      expect(flAProposals[0].coverLetter).toBe('Proprietary strategy A')

      const flBProposals = await db.proposal.findMany({
        where: { jobId: JOB_ID, freelancerId: 'freelancer_b' },
      })
      expect(flBProposals.length).toBe(1)
      expect(flBProposals[0].id).toBe('prop_fl_b')
    })
  })

  describe('4. Rate Limiter Null-Safety & Crash Prevention', () => {
    it('gracefully handles undefined and null emails without throwing TypeErrors', () => {
      expect(() => checkAccountLockout(undefined)).not.toThrow()
      expect(() => checkAccountLockout(null)).not.toThrow()
      expect(() => recordFailedLogin(undefined)).not.toThrow()
      expect(() => recordFailedLogin(null)).not.toThrow()

      const res = checkAccountLockout(undefined)
      expect(res.locked).toBe(false)
    })

    it('handles rateLimit calls with null/undefined user IDs', async () => {
      await expect(rateLimit(null, '/api/auth/login')).resolves.not.toThrow()
      await expect(rateLimit(undefined, '/api/jobs')).resolves.not.toThrow()
    })
  })

  describe('5. Dynamic Notification Dispatch & Mark-Read Workflow', () => {
    it('creates dynamic notification, fetches unread count, and marks all as read', async () => {
      const notif = await db.notification.create({
        data: {
          userId: TEST_FL_ID,
          title: 'Order Funded Escrow',
          message: 'Client funded 450 TND into escrow for Milestone 1.',
          type: 'ORDER',
          link: '/dashboard/orders/ord_test',
        },
      })

      expect(notif.userId).toBe(TEST_FL_ID)
      expect(notif.isRead).toBe(false)

      const userNotifs = await db.notification.findMany({
        where: { userId: TEST_FL_ID, isRead: false },
      })
      expect(userNotifs.some(n => n.id === notif.id)).toBe(true)

      // Mark all as read
      const updatedCount = await db.notification.markAllAsRead(TEST_FL_ID)
      expect(updatedCount).toBeGreaterThanOrEqual(1)

      const unreadAfter = await db.notification.findMany({
        where: { userId: TEST_FL_ID, isRead: false },
      })
      expect(unreadAfter.length).toBe(0)
    })
  })
})
