import {
  requireAuth,
  requireRole,
  requireOrderParty,
  requireOrderBuyer,
  requireOrderSeller,
  requireAdmin,
  requireOwnerOrAdmin,
} from '@/lib/authz'
import {
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins,
  rateLimit,
} from '@/lib/rateLimit'

describe('Phase 2: Auth Security & RLS Authorization Tests', () => {
  const clientSession = { user: { id: 'c1', name: 'Sami Mansour', email: 'sami.client@asteria.com', role: 'CLIENT' } } as any
  const freelancerSession = { user: { id: 'f1', name: 'Yassine Khelifi', email: 'yassine.freelancer@asteria.com', role: 'FREELANCER' } } as any
  const adminSession = { user: { id: 'admin1', name: 'Master Admin', email: 'admin.master@asteria.com', role: 'ADMIN' } } as any
  const unauthorizedSession = { user: { id: 'c2', name: 'Nour El Houda', email: 'nour.client@asteria.com', role: 'CLIENT' } } as any

  const testOrder = {
    id: 'ord_sec_1',
    buyerId: 'c1',
    sellerId: 'f1',
    amount: 500,
    status: 'ACTIVE',
  } as any

  describe('Server-Side Role Separation & Non-Owner Rejection', () => {
    it('rejects unauthenticated requests with 401', () => {
      const err = requireAuth(null)
      expect(err).not.toBeNull()
      expect(err?.status).toBe(401)
    })

    it('allows valid authenticated sessions', () => {
      const err = requireAuth(clientSession)
      expect(err).toBeNull()
    })

    it('strictly enforces role requirements', () => {
      expect(requireRole(clientSession, 'CLIENT')).toBeNull()
      expect(requireRole(clientSession, 'FREELANCER')?.status).toBe(403)
      expect(requireRole(clientSession, 'ADMIN')?.status).toBe(403)

      expect(requireRole(freelancerSession, 'FREELANCER')).toBeNull()
      expect(requireRole(freelancerSession, 'CLIENT')?.status).toBe(403)

      expect(requireAdmin(adminSession)).toBeNull()
      expect(requireAdmin(freelancerSession)?.status).toBe(403)
    })

    it('rejects non-owner party access on contracts', () => {
      expect(requireOrderParty(clientSession, testOrder)).toBeNull()
      expect(requireOrderParty(freelancerSession, testOrder)).toBeNull()
      expect(requireOrderParty(unauthorizedSession, testOrder)?.status).toBe(403)
    })

    it('enforces buyer-only and seller-only operations', () => {
      // Buyer actions (e.g. complete order / release escrow)
      expect(requireOrderBuyer(clientSession, testOrder)).toBeNull()
      expect(requireOrderBuyer(freelancerSession, testOrder)?.status).toBe(403)
      expect(requireOrderBuyer(unauthorizedSession, testOrder)?.status).toBe(403)

      // Seller actions (e.g. submit work deliverable)
      expect(requireOrderSeller(freelancerSession, testOrder)).toBeNull()
      expect(requireOrderSeller(clientSession, testOrder)?.status).toBe(403)
      expect(requireOrderSeller(unauthorizedSession, testOrder)?.status).toBe(403)
    })

    it('allows owners and admins while blocking third parties on resources', () => {
      expect(requireOwnerOrAdmin(freelancerSession, 'f1')).toBeNull()
      expect(requireOwnerOrAdmin(adminSession, 'f1')).toBeNull()
      expect(requireOwnerOrAdmin(clientSession, 'f1')?.status).toBe(403)
    })
  })

  describe('Account Lockout & Brute-Force Defense', () => {
    const testEmail = 'brute_force_target@asteria.com'

    beforeEach(() => {
      resetFailedLogins(testEmail)
    })

    it('tracks failed attempts and locks after 5 consecutive failures', () => {
      expect(checkAccountLockout(testEmail).locked).toBe(false)

      for (let i = 1; i <= 4; i++) {
        const res = recordFailedLogin(testEmail)
        expect(res.locked).toBe(false)
        expect(res.attemptsLeft).toBe(5 - i)
      }

      // 5th failed attempt locks the account
      const fifth = recordFailedLogin(testEmail)
      expect(fifth.locked).toBe(true)
      expect(fifth.attemptsLeft).toBe(0)

      // Check lockout status
      const status = checkAccountLockout(testEmail)
      expect(status.locked).toBe(true)
      expect(status.retryAfterSecs).toBeGreaterThan(0)
    })

    it('resets failed login counter upon successful authentication', () => {
      recordFailedLogin(testEmail)
      recordFailedLogin(testEmail)
      resetFailedLogins(testEmail)

      expect(checkAccountLockout(testEmail).locked).toBe(false)
    })
  })

  describe('Rate Limiting on Endpoints', () => {
    it('allows requests within limit and returns 429 when threshold exceeded', async () => {
      const testUser = 'user_ratelimit_test'
      const endpoint = '/api/jobs'
      const opts = { limit: 3, windowSecs: 10 }

      const res1 = await rateLimit(testUser, endpoint, opts)
      const res2 = await rateLimit(testUser, endpoint, opts)
      const res3 = await rateLimit(testUser, endpoint, opts)

      expect(res1).toBeNull()
      expect(res2).toBeNull()
      expect(res3).toBeNull()

      // 4th request exceeds limit
      const res4 = await rateLimit(testUser, endpoint, opts)
      expect(res4).not.toBeNull()
      expect(res4?.status).toBe(429)
    })
  })
})
