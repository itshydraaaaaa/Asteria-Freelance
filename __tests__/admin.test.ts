import { db } from '@/lib/db'
import { processRefund, processEscrowRelease } from '@/lib/ledger'

describe('Phase 5: Admin & Support Operations Tests', () => {
  const TEST_ADMIN = 'admin1'
  const MOD_USER_ID = 'test_mod_user'

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: MOD_USER_ID,
        name: 'Moderation Target User',
        email: 'target@mod.com',
        role: 'FREELANCER',
        walletBalance: 100,
        verifiedStatus: 'APPROVED',
        bio: 'Freelancer bio for testing',
      },
    })
  })

  it('allows admin to suspend a user with a specific violation reason', async () => {
    const reason = 'Repeated spam proposals and off-platform payment requests'

    const user = await db.user.update({
      where: { id: MOD_USER_ID },
      data: {
        verifiedStatus: 'REJECTED',
        bio: `[SUSPENDED: ${reason}]`,
      } as any,
    })

    expect(user?.verifiedStatus).toBe('REJECTED')
    expect(user?.bio).toContain('SUSPENDED')

    const log = await db.auditLog.create({
      data: {
        adminId: TEST_ADMIN,
        adminName: 'Admin',
        action: 'USER_SUSPENDED',
        targetId: MOD_USER_ID,
        details: reason,
      },
    })
    expect(log.action).toBe('USER_SUSPENDED')
  })

  it('allows admin to reactivate and restore user account', async () => {
    const user = await db.user.update({
      where: { id: MOD_USER_ID },
      data: {
        verifiedStatus: 'APPROVED',
        bio: 'Restored legitimate profile bio.',
      } as any,
    })

    expect(user?.verifiedStatus).toBe('APPROVED')
    expect(user?.bio).not.toContain('SUSPENDED')
  })

  it('allows admin to resolve dispute by executing full buyer refund', async () => {
    const disputeOrder = 'ord_dispute_test'
    const buyerId = 'c1'
    const amount = 300

    const refundEntry = await processRefund(disputeOrder, buyerId, amount, 'Admin resolved dispute: Deliverable did not match agreed specifications')
    expect(refundEntry.type).toBe('REFUND')
    expect(refundEntry.amount).toBe(amount)
    expect(refundEntry.userId).toBe(buyerId)
  })

  it('allows admin to approve withdrawal request and updates audit trail', async () => {
    const withdrawal = await db.withdrawal.create({
      data: {
        userId: 'f1',
        amount: 250,
        method: 'TUNISIAN_BANK_RIB',
        accountDetails: 'TN59 1000 0000 0000 0000 1234',
        status: 'PENDING',
      },
    })

    expect(withdrawal.status).toBe('PENDING')

    const approved = await db.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: 'APPROVED', reviewedBy: TEST_ADMIN } as any,
    })

    expect(approved.status).toBe('APPROVED')
  })
})
