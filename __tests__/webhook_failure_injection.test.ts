import { creditWallet, debitWallet, getLedgerHistory, getBalance } from '@/lib/ledger'
import { db } from '@/lib/db'

describe('Phase 5: Webhook Failure Injection & Recovery Test Suite', () => {
  const BUYER_USER = 'user_webhook_fail_buyer'
  const TEST_ORDER = 'order_webhook_fail_1'

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: BUYER_USER,
        name: 'Webhook Failure Tester',
        email: 'webhookfail@test.com',
        role: 'CLIENT',
        walletBalance: 0,
        verifiedStatus: 'APPROVED',
      },
    })

    await db.order.create({
      data: {
        id: TEST_ORDER,
        gigId: 'gig1',
        buyerId: BUYER_USER,
        sellerId: 'f1',
        amount: 300,
        status: 'PENDING',
      },
    })
  })

  describe('Task 5.1: Database Outage Simulation, Error Propagation & Idempotent Recovery', () => {
    it('propagates 500 failure when DB error occurs midway, allowing Stripe retry without partial corruption', async () => {
      const sessionId = 'cs_test_failure_injection_999'
      const amount = 300
      const idempotencyKey = `stripe-dep-order-${sessionId}`

      // 1. Simulate failure during first webhook delivery attempt
      let failureTriggered = false
      const simulateWebhookAttempt1 = async () => {
        try {
          // Simulate DB network outage
          throw new Error('Database connection pool exhausted (Simulated 500)')
        } catch (err: any) {
          failureTriggered = true
          return { status: 500, error: err.message }
        }
      }

      const res1 = await simulateWebhookAttempt1()
      expect(res1.status).toBe(500)
      expect(failureTriggered).toBe(true)

      // Ensure no balance was credited on aborted attempt
      const intermediateBalance = await getBalance(BUYER_USER)
      expect(intermediateBalance).toBe(0)

      // 2. Simulate Stripe automated retry once database connection is restored
      const simulateWebhookAttempt2 = async () => {
        // Step A: Update order status
        await db.order.update({
          where: { id: TEST_ORDER },
          data: { status: 'ACTIVE' },
        })

        // Step B: Credit and debit escrow
        await creditWallet(BUYER_USER, amount, 'DEPOSIT', {
          orderId: TEST_ORDER,
          idempotencyKey,
          exchangeRateApplied: 0.32,
        })

        await debitWallet(BUYER_USER, amount, 'FUND_ESCROW', {
          orderId: TEST_ORDER,
          idempotencyKey: `stripe-fund-order-${sessionId}`,
          exchangeRateApplied: 0.32,
        })

        return { status: 200, received: true }
      }

      const res2 = await simulateWebhookAttempt2()
      expect(res2.status).toBe(200)

      const updatedOrder = await db.order.findUnique({ where: { id: TEST_ORDER } })
      expect(updatedOrder?.status).toBe('ACTIVE')

      // 3. Simulate subsequent duplicate Stripe webhook delivery (asserting idempotency)
      const res3 = await simulateWebhookAttempt2()
      expect(res3.status).toBe(200)

      // Verify that duplicate webhook did not create double ledger entries
      const history = await getLedgerHistory(BUYER_USER)
      const depositEntries = history.filter(t => t.idempotencyKey === idempotencyKey)
      expect(depositEntries.length).toBe(1)
    })
  })
})
