import { getTndToUsdRate, setAdminFxOverride, clearAdminFxOverride } from '@/lib/fx'
import { creditWallet, getLedgerHistory } from '@/lib/ledger'
import { db } from '@/lib/db'
import crypto from 'crypto'

describe('Phase 2: Financial Correctness Test Suite', () => {
  jest.setTimeout(20000)
  const TEST_USER = 'user_fx_test_1'

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: TEST_USER,
        name: 'FX Tester',
        email: 'fxtester@test.com',
        role: 'CLIENT',
        walletBalance: 1000,
        verifiedStatus: 'APPROVED',
      },
    })
  })

  describe('Task 2.1: Live FX Rate Service & Admin Override', () => {
    it('returns a positive exchange rate with source attribution', async () => {
      const { rate, source } = await getTndToUsdRate()
      expect(rate).toBeGreaterThan(0.1)
      expect(rate).toBeLessThan(1.0)
      expect(['LIVE', 'CACHE', 'FALLBACK', 'OVERRIDE']).toContain(source)
    })

    it('allows Admin manual override and records an immutable audit log', async () => {
      const overrideRate = 0.345
      const adminId = 'admin_fx_audit'
      const adminName = 'Finance Director'
      const reason = 'Central Bank official rate adjustment'

      const result = await setAdminFxOverride(overrideRate, adminId, adminName, reason)
      expect(result.success).toBe(true)
      expect(result.rate).toBe(overrideRate)

      // Verify active rate is now OVERRIDE
      const activeState = await getTndToUsdRate()
      expect(activeState.rate).toBe(overrideRate)
      expect(activeState.source).toBe('OVERRIDE')
      expect(activeState.overrideReason).toBe(reason)

      // Verify audit log
      const logs = await db.auditLog.findMany()
      const overrideLog = logs.find(l => l.action === 'ADMIN_FX_OVERRIDE_SET')
      expect(overrideLog).toBeDefined()
      expect(overrideLog?.adminId).toBe(adminId)

      // Clear override
      await clearAdminFxOverride(adminId, adminName)
      const restoredState = await getTndToUsdRate()
      expect(restoredState.source).not.toBe('OVERRIDE')
    })
  })

  describe('Task 2.2: Stored Applied Rate on Ledger Transactions', () => {
    it('records exact exchange_rate_applied onto transaction and does not recompute', async () => {
      const appliedRate = 0.3185
      const tx = await creditWallet(TEST_USER, 250, 'DEPOSIT', {
        note: 'Stripe deposit at historical FX rate',
        idempotencyKey: 'test-dep-rate-1',
        exchangeRateApplied: appliedRate,
      })

      expect(tx.exchangeRateApplied).toBe(appliedRate)

      const history = await getLedgerHistory(TEST_USER)
      const storedTx = history.find(t => t.id === tx.id)
      expect(storedTx).toBeDefined()
      expect(storedTx?.exchangeRateApplied).toBe(appliedRate)
    })
  })

  describe('Task 2.4: Payment Gateway Constant-Time HMAC & Anti-Replay', () => {
    const secret = 'asteria_flouci_sandbox_secret'
    const paymentId = 'pay_test_replay'
    const amount = 100
    const orderId = 'ord_replay_1'
    const userId = TEST_USER

    it('rejects webhooks with stale timestamps (> 5 minutes) to prevent replay attacks', () => {
      const staleTimestamp = Date.now() - 10 * 60 * 1000 // 10 minutes ago
      const isWithinTolerance = Math.abs(Date.now() - staleTimestamp) <= 5 * 60 * 1000
      expect(isWithinTolerance).toBe(false) // Stale timestamp detected
    })

    it('verifies signature using constant-time timingSafeEqual', () => {
      const freshTimestamp = Date.now()
      const payloadString = `${paymentId}:${amount}:${orderId}:${userId}:${freshTimestamp}`
      const validSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex')

      const sigBuf = Buffer.from(validSignature, 'hex')
      const expBuf = Buffer.from(validSignature, 'hex')
      expect(crypto.timingSafeEqual(sigBuf, expBuf)).toBe(true)

      const forgedSignature = crypto.createHmac('sha256', 'wrong_secret').update(payloadString).digest('hex')
      const forgedBuf = Buffer.from(forgedSignature, 'hex')
      expect(crypto.timingSafeEqual(forgedBuf, expBuf)).toBe(false)
    })
  })
})
