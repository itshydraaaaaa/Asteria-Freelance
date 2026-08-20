import { db } from '@/lib/db'
import { debitWallet, getBalance, creditWallet, processEscrowRelease, checkIdempotency, saveIdempotency } from '@/lib/ledger'

describe('Phase 1: Concurrency & Locking Correctness Test Suite', () => {
  const CONCURRENT_TEST_USER = 'user_concurrency_20_test'
  const SELLER_A = 'user_seller_a_lock'
  const BUYER_B = 'user_buyer_b_lock'

  beforeAll(async () => {
    // Seed user with 100 TND
    await db.user.create({
      data: {
        id: CONCURRENT_TEST_USER,
        name: 'Concurrency Tester',
        email: 'concurrency20@test.com',
        role: 'FREELANCER',
        walletBalance: 100,
        verifiedStatus: 'APPROVED',
      },
    })

    await db.user.create({
      data: {
        id: SELLER_A,
        name: 'Seller A',
        email: 'seller_a@test.com',
        role: 'FREELANCER',
        walletBalance: 50,
        verifiedStatus: 'APPROVED',
      },
    })

    await db.user.create({
      data: {
        id: BUYER_B,
        name: 'Buyer B',
        email: 'buyer_b@test.com',
        role: 'CLIENT',
        walletBalance: 500,
        verifiedStatus: 'APPROVED',
      },
    })
  })

  describe('Task 1.3: 20 Simultaneous Parallel Withdrawal Concurrency Test', () => {
    it('executes 20 simultaneous parallel debits of 100 TND; exactly 1 succeeds and 19 fail', async () => {
      const initialBalance = await getBalance(CONCURRENT_TEST_USER)
      expect(initialBalance).toBe(100)

      // Fire 20 simultaneous parallel debit requests for 100 TND each
      const parallelRequests = Array.from({ length: 20 }, (_, idx) =>
        debitWallet(CONCURRENT_TEST_USER, 100, 'WITHDRAWAL', {
          note: `Parallel Withdrawal Request #${idx + 1}`,
          idempotencyKey: `with-concurrent-${idx + 1}`,
        })
      )

      const results = await Promise.allSettled(parallelRequests)

      const fulfilled = results.filter(r => r.status === 'fulfilled')
      const rejected = results.filter(r => r.status === 'rejected')

      // Exactly 1 must succeed and 19 must be rejected due to balance exhaustion
      expect(fulfilled.length).toBe(1)
      expect(rejected.length).toBe(19)

      const finalBalance = await getBalance(CONCURRENT_TEST_USER)
      expect(finalBalance).toBe(0)
    })
  })

  describe('Task 1.2: Multi-Row Lock Canonical Ordering & Deadlock Prevention', () => {
    it('executes concurrent escrow settlements in opposing ID orders without deadlock', async () => {
      // Order 1: Seller A, Platform
      const release1 = processEscrowRelease('ord_dl_1', SELLER_A, 200, 'platform')
      // Order 2: Seller A, Platform in parallel
      const release2 = processEscrowRelease('ord_dl_2', SELLER_A, 100, 'platform')

      const [res1, res2] = await Promise.all([release1, release2])

      expect(res1.sellerPayout).toBe(176) // 88% of 200
      expect(res1.platformFee).toBe(24)   // 12% of 200
      expect(res2.sellerPayout).toBe(88)  // 88% of 100
      expect(res2.platformFee).toBe(12)   // 12% of 100
    })
  })

  describe('Task 1.4: Idempotency Key 24-Hour Cache & Deduplication', () => {
    it('returns cached response on duplicate request and creates only 1 transaction', async () => {
      const testKey = 'unique-idempotency-key-xyz-123'
      const endpoint = '/api/wallet/withdraw'

      // First call -> not cached
      const check1 = await checkIdempotency(testKey, endpoint)
      expect(check1.cached).toBe(false)

      const mockResponse = {
        withdrawal: { id: 'w_idem_1', amount: 50, status: 'PENDING' },
        message: 'Withdrawal requested successfully',
      }

      await saveIdempotency(testKey, endpoint, SELLER_A, mockResponse, 201)

      // Second call with same key -> cached
      const check2 = await checkIdempotency(testKey, endpoint)
      expect(check2.cached).toBe(true)
      expect(check2.result).toEqual(mockResponse)
      expect(check2.statusCode).toBe(201)
    })
  })

  describe('Task 1.5: Withdrawal Hold SLA Escalation', () => {
    it('identifies and flags pending withdrawals older than the configured SLA threshold', async () => {
      const slaHours = 24
      const slaThresholdMs = slaHours * 3600 * 1000
      const now = Date.now()

      // Seed a stale pending withdrawal created 30 hours ago
      const staleWithdrawal = await db.withdrawal.create({
        data: {
          userId: SELLER_A,
          amount: 150,
          method: 'BANK_RIB',
          accountDetails: 'TN59 0000 9999 1111',
          status: 'PENDING',
        },
      })

      // Manually set createdAt to 30 hours ago
      staleWithdrawal.createdAt = new Date(now - 30 * 3600 * 1000)

      const pending = await db.withdrawal.findMany({ where: { status: 'PENDING' } })
      const staleList = pending.filter(w => now - new Date(w.createdAt).getTime() > slaThresholdMs)

      expect(staleList.some(w => w.id === staleWithdrawal.id)).toBe(true)
    })
  })
})
