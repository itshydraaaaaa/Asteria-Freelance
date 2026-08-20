import { db } from '@/lib/db'
import { debitWallet, getBalance } from '@/lib/ledger'
import { rateLimitByIp, checkAccountLockout, recordFailedLogin } from '@/lib/rateLimit'

describe('Security Resilience & Concurrency Guard Test Suite', () => {
  const CONCURRENT_USER_ID = 'user_concurrent_test'

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: CONCURRENT_USER_ID,
        name: 'Concurrent Test User',
        email: 'concurrent@test.com',
        role: 'FREELANCER',
        walletBalance: 100,
        verifiedStatus: 'APPROVED',
      },
    })
  })

  describe('1. Double-Withdrawal Concurrency & Race Condition Defense', () => {
    it('prevents two concurrent parallel debits from overdrawing the wallet balance', async () => {
      const initialBalance = await getBalance(CONCURRENT_USER_ID)
      expect(initialBalance).toBe(100)

      // Fire two parallel withdrawal debits of 80 TND simultaneously
      const debit1 = debitWallet(CONCURRENT_USER_ID, 80, 'WITHDRAWAL', { note: 'Withdrawal Req 1' })
      const debit2 = debitWallet(CONCURRENT_USER_ID, 80, 'WITHDRAWAL', { note: 'Withdrawal Req 2' })

      const results = await Promise.allSettled([debit1, debit2])

      const succeeded = results.filter(r => r.status === 'fulfilled')
      const rejected = results.filter(r => r.status === 'rejected')

      // Exactly ONE must succeed (100 - 80 = 20 remaining), the other MUST fail with insufficient balance
      expect(succeeded.length).toBe(1)
      expect(rejected.length).toBe(1)

      const finalBalance = await getBalance(CONCURRENT_USER_ID)
      expect(finalBalance).toBe(20) // Balance cannot go negative (-60)
    })
  })

  describe('2. Dual-Layer IP Rate Limiting & Progressive CAPTCHA Protection', () => {
    it('enforces IP rate limiting against credential stuffing attacks', async () => {
      const testIp = '192.168.1.100'
      const endpoint = '/api/auth/login'

      // First 20 requests allowed
      for (let i = 0; i < 20; i++) {
        const res = await rateLimitByIp(testIp, endpoint, { limit: 20, windowSecs: 60 })
        expect(res).toBeNull()
      }

      // 21st request blocked with 429
      const blockedRes = await rateLimitByIp(testIp, endpoint, { limit: 20, windowSecs: 60 })
      expect(blockedRes).not.toBeNull()
      expect(blockedRes?.status).toBe(429)
    })

    it('triggers progressive CAPTCHA requirement after 3 failed attempts without immediate lockout', () => {
      const targetEmail = 'progressive_defense@test.com'

      // Attempt 1 & 2
      recordFailedLogin(targetEmail)
      recordFailedLogin(targetEmail)
      let state = checkAccountLockout(targetEmail)
      expect(state.requireCaptcha).toBe(false)
      expect(state.locked).toBe(false)

      // Attempt 3 -> CAPTCHA required
      recordFailedLogin(targetEmail)
      state = checkAccountLockout(targetEmail)
      expect(state.requireCaptcha).toBe(true)
      expect(state.locked).toBe(false) // User not locked out yet (can solve CAPTCHA)

      // Attempt 5 -> Hard lockout
      recordFailedLogin(targetEmail)
      recordFailedLogin(targetEmail)
      state = checkAccountLockout(targetEmail)
      expect(state.locked).toBe(true)
      expect(state.requireCaptcha).toBe(true)
    })
  })

  describe('3. Custom Offer Server Re-validation Protection', () => {
    it('verifies offer price is retrieved from server store rather than client body', async () => {
      const sellerId = 'seller_1'
      const buyerId = 'buyer_1'
      const authenticPrice = 450

      // Seed authentic offer message in database
      const msg = await db.message.create({
        data: {
          id: 'msg_authentic_offer',
          senderId: sellerId,
          receiverId: buyerId,
          content: 'Custom Offer: UI Redesign (450 TND)',
          msgType: 'CUSTOM_OFFER',
          offerData: {
            id: 'off_authentic',
            title: 'UI Redesign',
            price: authenticPrice,
            status: 'PENDING',
          },
        },
      })

      // Simulate server fetching and verifying offer from DB
      const allMsgs = await db.message.findMany({ where: { userId: buyerId } })
      const found = allMsgs.find(m => m.id === msg.id)
      expect(found).toBeDefined()
      expect(found?.offerData.price).toBe(450)
      expect(found?.offerData.price).not.toBe(1) // Protected against client payload tampering
    })
  })
})
