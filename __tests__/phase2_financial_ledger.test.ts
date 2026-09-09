import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import {
  processEscrowRelease,
  processMilestoneRelease,
  creditWallet,
  debitWallet,
  getBalance,
  PLATFORM_TREASURY_USER_ID,
} from '@/lib/ledger'
import { POST as withdrawRoute } from '@/app/api/wallet/withdraw/route'
import { withIdempotency, clearMemoryIdempotencyStore } from '@/lib/idempotency'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => {
  const original = jest.requireActual('@/lib/auth')
  return {
    ...original,
    auth: jest.fn(),
  }
})

describe('Phase 2: Financial Escrow & Ledger Hardening Tests', () => {
  const FREELANCER_ID = 'f_phase2_test'
  const BUYER_ID = 'b_phase2_test'

  beforeAll(async () => {
    // Seed Freelancer
    await db.user.create({
      data: {
        id: FREELANCER_ID,
        name: 'Phase2 Freelancer',
        email: 'freelancer_p2@test.com',
        role: 'FREELANCER',
        walletBalance: 100,
        verifiedStatus: 'APPROVED',
      },
    })

    // Seed Buyer
    await db.user.create({
      data: {
        id: BUYER_ID,
        name: 'Phase2 Buyer',
        email: 'buyer_p2@test.com',
        role: 'CLIENT',
        walletBalance: 1000,
        verifiedStatus: 'APPROVED',
      },
    })
  })

  beforeEach(() => {
    clearMemoryIdempotencyStore();
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: FREELANCER_ID,
        email: 'freelancer_p2@test.com',
        role: 'FREELANCER',
        name: 'Phase2 Freelancer',
      },
    })
  })

  describe('Double-Entry Escrow Release Mathematics (Zero Drift)', () => {
    const testCases = [
      { amount: 100.0, expectedFee: 12.0, expectedPayout: 88.0 },
      { amount: 99.99, expectedFee: 12.0, expectedPayout: 87.99 },
      { amount: 33.33, expectedFee: 4.0, expectedPayout: 29.33 },
      { amount: 7.77, expectedFee: 0.93, expectedPayout: 6.84 },
      { amount: 1.01, expectedFee: 0.12, expectedPayout: 0.89 },
      { amount: 250.5, expectedFee: 30.06, expectedPayout: 220.44 },
    ]

    testCases.forEach(({ amount, expectedFee, expectedPayout }) => {
      it(`accurately splits ${amount} TND into exact cent sums without drift (${expectedPayout} + ${expectedFee} = ${amount})`, async () => {
        const orderId = `ord_math_${amount}`
        const result = await processEscrowRelease(orderId, FREELANCER_ID, amount)

        expect(result.platformFee).toBe(expectedFee)
        expect(result.sellerPayout).toBe(expectedPayout)
        expect(Math.round((result.sellerPayout + result.platformFee) * 100) / 100).toBe(amount)
      })
    })

    it('releases milestone escrow with exact integer cent commission', async () => {
      const result = await processMilestoneRelease('ord_ms_1', 'ms_1', FREELANCER_ID, 150)
      expect(result.platformFee).toBe(18) // 12% of 150
      expect(result.sellerPayout).toBe(132) // 88% of 150
      expect(result.sellerPayout + result.platformFee).toBe(150)
    })
  })

  describe('Wallet Withdrawal Protections', () => {
    it('rejects withdrawal below minimum threshold (20 TND)', async () => {
      const req = new NextRequest('http://localhost/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 15,
          method: 'Flouci (Tunisia)',
          accountDetails: '+21699999999',
        }),
      })

      const res = await withdrawRoute(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('Minimum withdrawal amount is 20 TND')
    })

    it('rejects withdrawal if KYC status is not APPROVED', async () => {
      const UNVERIFIED_ID = 'f_unverified_p2'
      await db.user.create({
        data: {
          id: UNVERIFIED_ID,
          name: 'Unverified Freelancer',
          email: 'unverified@test.com',
          role: 'FREELANCER',
          walletBalance: 200,
          verifiedStatus: 'PENDING',
        },
      });

      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: UNVERIFIED_ID,
          email: 'unverified@test.com',
          role: 'FREELANCER',
          name: 'Unverified Freelancer',
        },
      })

      const req = new NextRequest('http://localhost/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 50,
          method: 'Flouci (Tunisia)',
          accountDetails: '+21699999999',
        }),
      })

      const res = await withdrawRoute(req)
      const body = await res.json()

      expect(res.status).toBe(403)
      expect(body.error).toContain('Identity verification (KYC) is required')
    })

    it('rejects withdrawal when requested amount exceeds available balance', async () => {
      const req = new NextRequest('http://localhost/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 999999,
          method: 'Tunisian Bank Transfer (RIB)',
          accountDetails: 'TN59 1000 0000 0000 0000 1234',
        }),
      })

      const res = await withdrawRoute(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('Insufficient available balance')
    })

    it('successfully debits balance and creates pending withdrawal when valid', async () => {
      const initialUser = await db.user.findUnique({ where: { id: FREELANCER_ID } })
      const initialBalance = Number(initialUser?.walletBalance ?? 0)
      const withdrawAmt = 30

      const req = new NextRequest('http://localhost/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmt,
          method: 'Flouci (Tunisia)',
          accountDetails: '+21698765432',
        }),
      })

      const res = await withdrawRoute(req)
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.withdrawal).toBeDefined()
      expect(body.withdrawal.status).toBe('PENDING')
      expect(body.withdrawal.amount).toBe(withdrawAmt)

      const updatedUser = await db.user.findUnique({ where: { id: FREELANCER_ID } })
      expect(Number(updatedUser?.walletBalance)).toBe(Math.round((initialBalance - withdrawAmt) * 100) / 100)
    })

    it('idempotency: identical withdrawal request does not double-debit balance', async () => {
      const user = await db.user.findUnique({ where: { id: FREELANCER_ID } })
      const startBalance = Number(user?.walletBalance ?? 0)
      const idempotencyKey = `wth-idem-test-${Date.now()}`
      const withdrawAmt = 25

      const makeRequest = () =>
        new NextRequest('http://localhost/api/wallet/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'idempotency-key': idempotencyKey,
          },
          body: JSON.stringify({
            amount: withdrawAmt,
            method: 'Flouci (Tunisia)',
            accountDetails: '+21698765432',
          }),
        })

      // First call
      const res1 = await withdrawRoute(makeRequest())
      expect(res1.status).toBe(201)

      const balanceAfterFirst = (await db.user.findUnique({ where: { id: FREELANCER_ID } }))?.walletBalance

      // Second call with same idempotency key
      const res2 = await withdrawRoute(makeRequest())
      expect(res2.status).toBe(201)
      expect(res2.headers.get('X-Idempotency-Status')).toBe('CACHED')

      const balanceAfterSecond = (await db.user.findUnique({ where: { id: FREELANCER_ID } }))?.walletBalance

      // Balance MUST NOT have been deducted a second time
      expect(balanceAfterSecond).toBe(balanceAfterFirst)
      expect(Number(balanceAfterSecond)).toBe(Math.round((startBalance - withdrawAmt) * 100) / 100)
    })
  })

  describe('Concurrent Multi-User Lock & Double Spend Protection', () => {
    it('prevents double spending under concurrent debit attempts', async () => {
      const RACE_USER_ID = 'f_race_test'
      await db.user.create({
        data: {
          id: RACE_USER_ID,
          name: 'Race Condition Freelancer',
          email: 'race@test.com',
          role: 'FREELANCER',
          walletBalance: 50,
          verifiedStatus: 'APPROVED',
        },
      })

      // Attempt two concurrent debits of 40 TND each on an account with only 50 TND
      const debit1 = debitWallet(RACE_USER_ID, 40, 'WITHDRAWAL', { note: 'Race attempt 1' })
      const debit2 = debitWallet(RACE_USER_ID, 40, 'WITHDRAWAL', { note: 'Race attempt 2' })

      const results = await Promise.allSettled([debit1, debit2])

      const succeeded = results.filter(r => r.status === 'fulfilled')
      const rejected = results.filter(r => r.status === 'rejected')

      // Exactly one must succeed, and one must be rejected with Insufficient wallet balance
      expect(succeeded.length).toBe(1)
      expect(rejected.length).toBe(1)

      const finalUser = await db.user.findUnique({ where: { id: RACE_USER_ID } })
      expect(Number(finalUser?.walletBalance)).toBe(10) // 50 - 40 = 10, never negative!
    })
  })
})
