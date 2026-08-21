import {
  getBalance,
  creditWallet,
  debitWallet,
  processEscrowRelease,
  processMilestoneRelease,
  processRefund,
  getReconciliationReport,
  PLATFORM_FEE_RATE,
} from '@/lib/ledger'

describe('Phase 1: Escrow Correctness & Reconciliation Tests', () => {
  const TEST_USER = 'c1_reconciliation'
  const TEST_SELLER = 'f1_reconciliation'
  const TEST_ORDER = 'ord_test_phase1'

  beforeAll(async () => {
    const { db } = await import('@/lib/db')
    await db.user.create({
      data: {
        id: TEST_USER,
        name: 'Reconciliation Client',
        email: 'reconciliation_c1@asteria.com',
        role: 'CLIENT',
        walletBalance: 0,
        verifiedStatus: 'APPROVED',
      },
    })
    await db.user.create({
      data: {
        id: TEST_SELLER,
        name: 'Reconciliation Freelancer',
        email: 'reconciliation_f1@asteria.com',
        role: 'FREELANCER',
        walletBalance: 0,
        verifiedStatus: 'APPROVED',
      },
    })
  })

  it('verifies platform fee rate is set to 12%', () => {
    expect(PLATFORM_FEE_RATE).toBe(0.12)
  })

  it('credits and debits wallet balance correctly with 2-decimal precision', async () => {
    const initialBal = await getBalance(TEST_USER)
    expect(initialBal).toBeGreaterThanOrEqual(0)

    const creditEntry = await creditWallet(TEST_USER, 500.55, 'DEPOSIT', {
      note: 'Test Deposit',
      idempotencyKey: `test-credit-${Date.now()}`,
    })
    expect(creditEntry.amount).toBe(500.55)
    expect(creditEntry.balanceAfter).toBe(Math.round((initialBal + 500.55) * 100) / 100)

    const debitEntry = await debitWallet(TEST_USER, 200.25, 'FUND_ESCROW', {
      orderId: TEST_ORDER,
      note: 'Test Escrow Lock',
      idempotencyKey: `test-debit-${Date.now()}`,
    })
    expect(debitEntry.amount).toBe(-200.25)
    expect(debitEntry.balanceAfter).toBe(Math.round((creditEntry.balanceAfter - 200.25) * 100) / 100)
  })

  it('enforces idempotency and prevents double-debiting or double-crediting', async () => {
    const key = `idemp-${Date.now()}`
    const entry1 = await creditWallet(TEST_USER, 100, 'DEPOSIT', { idempotencyKey: key })
    const entry2 = await creditWallet(TEST_USER, 100, 'DEPOSIT', { idempotencyKey: key })

    expect(entry1.id).toBe(entry2.id)
    expect(entry1.balanceAfter).toBe(entry2.balanceAfter)
  })

  it('calculates 88% net freelancer payout and 12% platform fee on order release', async () => {
    const orderAmount = 1000
    const { sellerPayout, platformFee } = await processEscrowRelease(
      TEST_ORDER,
      TEST_SELLER,
      orderAmount,
      'admin1'
    )

    expect(sellerPayout).toBe(880) // 88% of 1000
    expect(platformFee).toBe(120)  // 12% of 1000
    expect(sellerPayout + platformFee).toBe(orderAmount)
  })

  it('handles fractional amounts and edge cases in multi-milestone release without rounding loss', async () => {
    const milestoneAmount = 333.33
    const { sellerPayout, platformFee } = await processMilestoneRelease(
      TEST_ORDER,
      'ms_1',
      TEST_SELLER,
      milestoneAmount
    )

    expect(sellerPayout).toBe(293.33) // 333.33 * 0.88 = 293.3304 -> 293.33
    expect(platformFee).toBe(40.00)   // 333.33 * 0.12 = 39.9996 -> 40.00
    expect(Math.abs((sellerPayout + platformFee) - milestoneAmount)).toBeLessThanOrEqual(0.01)
  })

  it('processes full and partial refunds to buyers securely', async () => {
    const refundAmount = 250
    const refundEntry = await processRefund(TEST_ORDER, TEST_USER, refundAmount, 'Scope revision agreed')
    expect(refundEntry.type).toBe('REFUND')
    expect(refundEntry.amount).toBe(refundAmount)
  })

  it('generates an automated reconciliation report with zero critical discrepancies', async () => {
    const report = await getReconciliationReport()
    expect(report).toBeDefined()
    expect(report.currency).toBe('TND')
    expect(report.totalUserBalances).toBeGreaterThanOrEqual(0)
    expect(report.totalEscrowLocked).toBeGreaterThanOrEqual(0)
    expect(report.anomalies).toEqual([])
  })
})
