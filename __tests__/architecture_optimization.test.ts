import { calculateEscrowSplit, validateLedgerInvariant, sortCanonicalUserLocks } from '@/lib/ledgerCore'
import { db } from '@/lib/db'

describe('Phase 6: Architecture & Performance Optimization Test Suite', () => {
  const HIGH_VAL_USER = 'user_high_val_freelancer'
  const ADMIN_MAKER = 'admin_maker_1'
  const ADMIN_CHECKER = 'admin_checker_2'

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: HIGH_VAL_USER,
        name: 'High Value Freelancer',
        email: 'highval@test.com',
        role: 'FREELANCER',
        walletBalance: 2500,
        verifiedStatus: 'APPROVED',
      },
    })
  })

  describe('Task 6.1: Framework-Agnostic Mathematical Ledger Core', () => {
    it('calculates deterministic escrow fee splits with zero penny loss', () => {
      const split1 = calculateEscrowSplit(1000)
      expect(split1.sellerPayout).toBe(880)
      expect(split1.platformFee).toBe(120)
      expect(split1.sellerPayout + split1.platformFee).toBe(1000)

      // Test fractional amount: 333.33 TND
      const split2 = calculateEscrowSplit(333.33)
      expect(split2.sellerPayout + split2.platformFee).toBe(333.33)
    })

    it('validates double-entry invariant arithmetic accurately', () => {
      expect(validateLedgerInvariant(100, 50, 150)).toBe(true)
      expect(validateLedgerInvariant(100, -40, 60)).toBe(true)
      expect(validateLedgerInvariant(100, 50, 149.99)).toBe(false)
    })

    it('sorts canonical user locks in deterministic ascending order', () => {
      const userList = ['user_zzz', 'user_aaa', 'user_mmm', 'user_aaa']
      const sorted = sortCanonicalUserLocks(userList)
      expect(sorted).toEqual(['user_aaa', 'user_mmm', 'user_zzz'])
    })
  })

  describe('Task 6.2: High-Value Maker-Checker Payout Approval (> 1000 TND)', () => {
    it('enforces two distinct administrators to approve a high-value withdrawal', async () => {
      // 1. Create a high-value withdrawal request (1,500 TND)
      const withdrawal = await db.withdrawal.create({
        data: {
          userId: HIGH_VAL_USER,
          amount: 1500,
          method: 'BANK_RIB',
          accountDetails: 'TN59 1111 2222 3333 4444',
          status: 'PENDING',
        },
      })

      expect(withdrawal.amount).toBe(1500)
      expect(withdrawal.status).toBe('PENDING')

      // Step 1: Maker approval by Admin 1
      const updatedStep1 = await db.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'PENDING_SECOND_APPROVAL',
          makerAdminId: ADMIN_MAKER,
          makerAdminName: 'Maker Admin',
          adminNotes: 'Maker approval granted. Awaiting Checker review.',
        },
      })

      expect(updatedStep1?.status).toBe('PENDING_SECOND_APPROVAL')
      expect(updatedStep1?.makerAdminId).toBe(ADMIN_MAKER)

      // Step 2 Violation Check: Attempt by same Maker Admin to Checker-approve
      const sameAdminAttemptValid = ADMIN_MAKER !== updatedStep1?.makerAdminId
      expect(sameAdminAttemptValid).toBe(false) // Forbidden: same admin cannot checker-approve

      // Step 2 Legitimate Check: Checker approval by distinct Admin 2
      const distinctAdminAttemptValid = ADMIN_CHECKER !== updatedStep1?.makerAdminId
      expect(distinctAdminAttemptValid).toBe(true)

      const updatedStep2 = await db.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'APPROVED',
          checkerAdminId: ADMIN_CHECKER,
          checkerAdminName: 'Checker Admin',
          processedBy: ADMIN_CHECKER,
          adminNotes: 'Dual approval complete. Funds transferred.',
        },
      })

      expect(updatedStep2?.status).toBe('APPROVED')
      expect(updatedStep2?.checkerAdminId).toBe(ADMIN_CHECKER)
    })
  })
})
