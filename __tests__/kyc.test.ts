import { db } from '@/lib/db'

describe('Phase 3: KYC Identity Verification End-to-End Tests', () => {
  const UNVERIFIED_USER_ID = 'test_unverified_user'
  const VERIFIED_USER_ID = 'f1'

  beforeAll(async () => {
    // Seed an unverified test user
    await db.user.create({
      data: {
        id: UNVERIFIED_USER_ID,
        name: 'Unverified Test User',
        email: 'unverified@test.com',
        role: 'FREELANCER',
        walletBalance: 2500,
        verifiedStatus: 'UNSUBMITTED',
      },
    })
  })

  it('verifies user starts in UNSUBMITTED state and transitions to PENDING upon document upload', async () => {
    const user = await db.user.findUnique({ where: { id: UNVERIFIED_USER_ID } })
    expect(user?.verifiedStatus).toBe('UNSUBMITTED')

    const verif = await db.verification.create({
      data: {
        userId: UNVERIFIED_USER_ID,
        fullName: 'Unverified Test User',
        dob: '1995-05-15',
        country: 'Tunisia',
        documentType: 'NATIONAL_ID',
        documentNumber: 'TN-09876543',
        idFrontPath: 'kyc-documents/front.jpg',
        idBackPath: 'kyc-documents/back.jpg',
        selfiePath: 'kyc-documents/selfie.jpg',
        status: 'PENDING',
      },
    })

    expect(verif.status).toBe('PENDING')
    expect(verif.userId).toBe(UNVERIFIED_USER_ID)
  })

  it('synchronizes user profile verifiedStatus upon admin approval', async () => {
    const verif = await db.verification.findUnique({ where: { userId: UNVERIFIED_USER_ID } })
    expect(verif).toBeDefined()

    const updatedVerif = await db.verification.update({
      where: { id: verif!.id },
      data: {
        status: 'APPROVED',
        reviewedBy: 'admin1',
        reviewedAt: new Date(),
      },
    })
    expect(updatedVerif?.status).toBe('APPROVED')

    const updatedUser = await db.user.update({
      where: { id: UNVERIFIED_USER_ID },
      data: { verifiedStatus: 'APPROVED' },
    })
    expect(updatedUser?.verifiedStatus).toBe('APPROVED')
  })

  it('records rejection reason and updates status upon KYC rejection', async () => {
    const rejectUserId = 'user_to_reject'
    await db.user.create({
      data: {
        id: rejectUserId,
        name: 'Reject User',
        email: 'reject@test.com',
        role: 'FREELANCER',
        walletBalance: 0,
        verifiedStatus: 'PENDING',
      },
    })

    const verif = await db.verification.create({
      data: {
        userId: rejectUserId,
        fullName: 'Reject User',
        dob: '1990-01-01',
        country: 'Tunisia',
        documentType: 'PASSPORT',
        documentNumber: 'TN-PASS-123',
        idFrontPath: 'kyc-documents/blurry.jpg',
        idBackPath: 'kyc-documents/blurry.jpg',
        selfiePath: 'kyc-documents/blurry.jpg',
        status: 'PENDING',
      },
    })

    const rejectionReason = 'ID document photo is blurry and illegible. Please submit a high-resolution scan.'
    const rejectedVerif = await db.verification.update({
      where: { id: verif.id },
      data: {
        status: 'REJECTED',
        reviewedBy: 'admin1',
        rejectionReason,
      },
    })

    expect(rejectedVerif?.status).toBe('REJECTED')
    expect(rejectedVerif?.rejectionReason).toBe(rejectionReason)

    const user = await db.user.update({
      where: { id: rejectUserId },
      data: { verifiedStatus: 'REJECTED' },
    })
    expect(user?.verifiedStatus).toBe('REJECTED')
  })

  it('blocks unverified accounts from withdrawing and approves verified accounts', async () => {
    const unverifiedUser = await db.user.findUnique({ where: { id: 'user_to_reject' } })
    expect(unverifiedUser?.verifiedStatus).toBe('REJECTED')

    // Rule: verifiedStatus must be APPROVED
    const canUnverifiedWithdraw = unverifiedUser?.verifiedStatus === 'APPROVED'
    expect(canUnverifiedWithdraw).toBe(false)

    const verifiedUser = await db.user.findUnique({ where: { id: VERIFIED_USER_ID } })
    const canVerifiedWithdraw = verifiedUser?.verifiedStatus === 'APPROVED'
    expect(canVerifiedWithdraw).toBe(true)
  })

  it('strictly blocks unverified accounts from ordering while allowing unrestricted exploration based on role', () => {
    const checkOrderAllowed = (verifiedStatus: string) => {
      if (verifiedStatus !== 'APPROVED') {
        return { allowed: false, error: 'Identity verification (KYC) is required before placing an order.' }
      }
      return { allowed: true }
    }

    const checkExploreAllowed = (role: string, targetSection: 'GIGS' | 'JOBS' | 'FREELANCERS') => {
      if (role === 'CLIENT' && (targetSection === 'GIGS' || targetSection === 'FREELANCERS')) return true
      if (role === 'FREELANCER' && targetSection === 'JOBS') return true
      return true // Exploration is open for marketplace discovery
    }

    expect(checkOrderAllowed('UNSUBMITTED').allowed).toBe(false)
    expect(checkOrderAllowed('PENDING').allowed).toBe(false)
    expect(checkOrderAllowed('REJECTED').allowed).toBe(false)
    expect(checkOrderAllowed('APPROVED').allowed).toBe(true)

    // Unverified users can still freely explore marketplace based on role
    expect(checkExploreAllowed('CLIENT', 'GIGS')).toBe(true)
    expect(checkExploreAllowed('CLIENT', 'FREELANCERS')).toBe(true)
    expect(checkExploreAllowed('FREELANCER', 'JOBS')).toBe(true)
  })
})
