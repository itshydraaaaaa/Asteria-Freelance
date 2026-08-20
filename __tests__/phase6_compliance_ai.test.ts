import { db } from '@/lib/db'

describe('Phase 6: Compliance, Data Export, Account Deletion & AI Moderation Tests', () => {
  const TEST_COMPLIANCE_USER = 'user_compliance_test'

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: TEST_COMPLIANCE_USER,
        name: 'Compliance Test User',
        email: 'compliance@test.com',
        role: 'CLIENT',
        walletBalance: 1200,
        verifiedStatus: 'APPROVED',
        bio: 'User for GDPR and compliance export testing',
      },
    })
  })

  describe('Data Privacy & GDPR Export / Deletion', () => {
    it('structures complete personal data payload for export', async () => {
      const user = await db.user.findUnique({ where: { id: TEST_COMPLIANCE_USER } })
      expect(user).toBeDefined()

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          walletBalance: user?.walletBalance,
        },
      }

      expect(exportPayload.user.id).toBe(TEST_COMPLIANCE_USER)
      expect(exportPayload.user.email).toBe('compliance@test.com')
    })

    it('anonymizes personal identifiable information upon account deletion', async () => {
      const deleteTarget = 'user_to_delete_gdpr'
      await db.user.create({
        data: {
          id: deleteTarget,
          name: 'Personal Name',
          email: 'personal@secret.com',
          role: 'FREELANCER',
          walletBalance: 0,
          verifiedStatus: 'APPROVED',
          bio: 'My personal biography',
        },
      })

      // Simulate deletion & anonymization
      const anonymized = await db.user.update({
        where: { id: deleteTarget },
        data: {
          name: `Deleted User (${deleteTarget.slice(0, 6)})`,
          email: `deleted_${deleteTarget}@anonymized.asteria.tn`,
          bio: '[Account Deleted Upon User Request]',
          verifiedStatus: 'UNSUBMITTED',
        } as any,
      })

      expect(anonymized?.name).toContain('Deleted User')
      expect(anonymized?.email).toContain('anonymized.asteria.tn')
      expect(anonymized?.bio).toContain('Deleted')
      expect(anonymized?.verifiedStatus).toBe('UNSUBMITTED')
    })
  })

  describe('AI Content Moderation & Disclosure Rules', () => {
    const PROHIBITED_PATTERNS = [
      /off-platform.*(whatsapp|telegram|direct payment|wire outside)/i,
      /bypass.*(escrow|asteria|commission|platform fee)/i,
      /scam|exploit|phishing|malware|hack/i,
    ]

    const moderateText = (text: string): boolean => {
      return !PROHIBITED_PATTERNS.some(p => p.test(text))
    }

    it('allows legitimate gig and job descriptions', () => {
      const safeText = 'Looking for a full-stack Next.js developer for an e-commerce marketplace.'
      expect(moderateText(safeText)).toBe(true)
    })

    it('detects and blocks off-platform payment attempts and scams', () => {
      const unsafeText1 = 'Contact me on WhatsApp for direct payment outside Asteria to bypass commission fee.'
      const unsafeText2 = 'Please download this exploit script to hack user databases.'

      expect(moderateText(unsafeText1)).toBe(false)
      expect(moderateText(unsafeText2)).toBe(false)
    })
  })
})
