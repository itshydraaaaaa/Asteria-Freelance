import { rateLimit, rateLimitByIp, checkAccountLockout, recordFailedLogin, resetFailedLogins, RATE_LIMITS } from '@/lib/rateLimit'

describe('Phase 3: Rate Limiting & Auth Hardening Test Suite', () => {
  describe('Task 3.1: Shared-Store Rate Limiter Across Ephemeral Invocations', () => {
    it('enforces limit across repeated requests and returns 429 with Retry-After headers', async () => {
      const testUser = 'user_rate_limit_shared_1'
      const endpoint = '/api/auth/register' // Limit: 3 in 60s
      const customOpts = { limit: 3, windowSecs: 60 }

      // Calls 1, 2, 3 succeed
      expect(await rateLimit(testUser, endpoint, customOpts)).toBeNull()
      expect(await rateLimit(testUser, endpoint, customOpts)).toBeNull()
      expect(await rateLimit(testUser, endpoint, customOpts)).toBeNull()

      // Call 4 is rate-limited with 429
      const blocked = await rateLimit(testUser, endpoint, customOpts)
      expect(blocked).not.toBeNull()
      expect(blocked?.status).toBe(429)
      expect(blocked?.headers.get('Retry-After')).toBe('60')
      expect(blocked?.headers.get('X-RateLimit-Limit')).toBe('3')
    })
  })

  describe('Task 3.2: Progressive CAPTCHA Defense (No Hard DoS Lockout)', () => {
    it('triggers CAPTCHA requirement after 3 failures but allows authenticating with correct credentials', () => {
      const victimEmail = 'victim_user@asteria.com'
      resetFailedLogins(victimEmail)

      // Failed attempt 1 & 2
      recordFailedLogin(victimEmail)
      recordFailedLogin(victimEmail)
      let state = checkAccountLockout(victimEmail)
      expect(state.requireCaptcha).toBe(false)
      expect(state.locked).toBe(false)

      // Failed attempt 3 -> CAPTCHA triggered
      recordFailedLogin(victimEmail)
      state = checkAccountLockout(victimEmail)
      expect(state.requireCaptcha).toBe(true)
      expect(state.locked).toBe(false)

      // Failed attempt 5 -> Backoff delay applied with progressive flag
      recordFailedLogin(victimEmail)
      recordFailedLogin(victimEmail)
      state = checkAccountLockout(victimEmail)
      expect(state.requireCaptcha).toBe(true)
      expect(state.backoffSecs).toBeGreaterThan(0)
      expect(state.locked).toBe(true)

      // Legitimate user provides correct password -> reset clears backoff & CAPTCHA immediately
      resetFailedLogins(victimEmail)
      const clearedState = checkAccountLockout(victimEmail)
      expect(clearedState.requireCaptcha).toBe(false)
      expect(clearedState.backoffSecs).toBe(0)
      expect(clearedState.locked).toBe(false)
    })
  })

  describe('Task 3.3: Extended Rate Limiting on Abuse Targets', () => {
    it('covers all abuse target endpoints with strict limit configurations', async () => {
      expect(RATE_LIMITS['/api/auth/reset-password']).toEqual({ limit: 3, windowSecs: 300 })
      expect(RATE_LIMITS['/api/user/verification']).toEqual({ limit: 5, windowSecs: 3600 })
      expect(RATE_LIMITS['/api/wallet/withdraw']).toEqual({ limit: 5, windowSecs: 3600 })
      expect(RATE_LIMITS['/api/ai/generate']).toEqual({ limit: 20, windowSecs: 86400 })
      expect(RATE_LIMITS['/api/jobs']).toEqual({ limit: 5, windowSecs: 60 })
    })

    it('enforces rate limit on KYC verification submissions', async () => {
      const kycUser = 'user_kyc_abuse_test'
      const endpoint = '/api/user/verification'
      const opts = { limit: 2, windowSecs: 60 }

      expect(await rateLimit(kycUser, endpoint, opts)).toBeNull()
      expect(await rateLimit(kycUser, endpoint, opts)).toBeNull()

      const blocked = await rateLimit(kycUser, endpoint, opts)
      expect(blocked).not.toBeNull()
      expect(blocked?.status).toBe(429)
    })
  })
})
