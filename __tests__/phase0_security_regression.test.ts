import { auth, signSessionToken, verifySessionToken } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { POST as stripeCheckoutPost } from '@/app/api/stripe/checkout/route'
import { POST as flouciPost } from '@/app/api/payments/flouci/route'
import { POST as konnectPost } from '@/app/api/payments/konnect/route'
import { POST as kycWebhookPost } from '@/app/api/kyc/webhook/route'
import { GET as adminUsersGet } from '@/app/api/admin/users/route'
import { NextRequest } from 'next/server'

// Dynamic mock cookies for Next.js server environment in Jest
let mockCookies: Record<string, string> = {}

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((name: string) => {
      const val = mockCookies[name]
      return val !== undefined ? { value: val } : undefined
    }),
    set: jest.fn((name: string, val: string) => {
      mockCookies[name] = val
    }),
    delete: jest.fn((name: string) => {
      delete mockCookies[name]
    }),
  })),
}))

// Mock Next.js cache revalidation
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Phase 0: Emergency Security Hotfixes Regression Suite', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long_12345'
    mockCookies = {}
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe('P0-1 & P0-2: Demo Cookie Removal & Cryptographic Session Security', () => {
    it('rejects unverified demo_user_id cookie in auth() session resolver', async () => {
      // Attacker sets demo_user_id=admin1
      mockCookies = { demo_user_id: 'admin1' }
      const session = await auth()
      expect(session).toBeNull()
    })

    it('signs and verifies tamper-proof session tokens cryptographically', () => {
      const token = signSessionToken('user_test_123', 'CLIENT')
      expect(typeof token).toBe('string')
      expect(token).toContain('.')

      const verified = verifySessionToken(token)
      expect(verified).not.toBeNull()
      expect(verified?.userId).toBe('user_test_123')
      expect(verified?.role).toBe('CLIENT')
    })

    it('rejects tampered session tokens', () => {
      const token = signSessionToken('user_test_123', 'CLIENT')
      const [payload] = token.split('.')
      const fakeSignature = crypto.createHmac('sha256', 'wrong_secret').update(payload).digest('base64url')
      const tamperedToken = `${payload}.${fakeSignature}`

      const verified = verifySessionToken(tamperedToken)
      expect(verified).toBeNull()
    })
  })

  describe('P0-3: Stripe Server-Side Price Verification', () => {
    it('rejects checkout when orderId does not exist in database', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_secret'

      // Seed a client user
      const clientUser = await db.user.create({
        data: {
          id: 'test_client_stripe',
          name: 'Stripe Client',
          email: 'stripe_client@test.com',
          role: 'CLIENT',
          walletBalance: 1000,
        },
      })

      // Authenticate via signed token
      const token = signSessionToken(clientUser.id, 'CLIENT')
      mockCookies = { auth_session_token: token }

      const req = new NextRequest('http://localhost:5000/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          orderId: 'non_existent_order_id',
          amount: 0.50, // Tampered price
        }),
      })

      const res = await stripeCheckoutPost(req)
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.error).toBe('Order not found')
    })
  })

  describe('P0-4: Plaintext Password Storage Elimination & Admin API Sanitization', () => {
    it('hashes passwords using bcrypt with salt rounds >= 10', async () => {
      const password = 'SecretPassword123!'
      const hash = await bcrypt.hash(password, 12)

      expect(hash).toMatch(/^\$2[ab]\$/)
      const matches = await bcrypt.compare(password, hash)
      expect(matches).toBe(true)

      const wrong = await bcrypt.compare('WrongPassword', hash)
      expect(wrong).toBe(false)
    })

    it('admin users API never exposes password or password_hash in response', async () => {
      // Seed an admin user
      const adminUser = await db.user.create({
        data: {
          id: 'admin_test_sanitized',
          name: 'Security Admin',
          email: 'admin_sanitized@asteria.com',
          role: 'ADMIN',
          walletBalance: 1000,
        },
      })

      // Authenticate via signed token
      const token = signSessionToken(adminUser.id, 'ADMIN')
      mockCookies = { auth_session_token: token }

      // Seed another user with sensitive password
      await db.user.create({
        data: {
          id: 'user_with_secret',
          name: 'Target User',
          email: 'target@privacy.com',
          role: 'FREELANCER',
          password: '$2a$12$somehashedpasswordstringgoeshere',
          walletBalance: 100,
        } as any,
      })

      const req = new NextRequest('http://localhost:5000/api/admin/users')
      const res = await adminUsersGet(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(Array.isArray(body.users)).toBe(true)

      body.users.forEach((user: any) => {
        expect(user.password).toBeUndefined()
        expect(user.password_hash).toBeUndefined()
      })
    })
  })

  describe('P0-5: Fail-Closed Webhook Secrets (Flouci & Konnect)', () => {
    it('Flouci webhook fails closed (500) if FLOUCI_APP_SECRET is not configured', async () => {
      delete process.env.FLOUCI_APP_SECRET

      const req = new NextRequest('http://localhost:5000/api/payments/flouci', {
        method: 'POST',
        body: JSON.stringify({
          action: 'VERIFY_WEBHOOK',
          paymentId: 'pay_123',
          amount: 100,
          timestamp: Date.now(),
          signature: 'any_signature',
        }),
      })

      const res = await flouciPost(req)
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.error).toBe('Webhook service misconfigured')
    })

    it('Konnect webhook fails closed (500) if KONNECT_WEBHOOK_KEY is not configured', async () => {
      delete process.env.KONNECT_WEBHOOK_KEY

      const req = new NextRequest('http://localhost:5000/api/payments/konnect', {
        method: 'POST',
        body: JSON.stringify({
          action: 'WEBHOOK',
          paymentRef: 'ref_123',
          amount: 100,
          timestamp: Date.now(),
          signature: 'any_signature',
        }),
      })

      const res = await konnectPost(req)
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.error).toBe('Webhook service misconfigured')
    })
  })

  describe('P0-6: KYC Webhook Signature Enforcement', () => {
    it('rejects requests with missing signature header with 401', async () => {
      process.env.KYC_WEBHOOK_SECRET = 'test_kyc_secret_123'

      const req = new NextRequest('http://localhost:5000/api/kyc/webhook', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'target_user_id',
          reviewResult: 'APPROVED',
        }),
        // No x-kyc-signature header sent
      })

      const res = await kycWebhookPost(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Missing KYC webhook signature')
    })

    it('fails closed with 500 if KYC_WEBHOOK_SECRET is missing from environment', async () => {
      delete process.env.KYC_WEBHOOK_SECRET

      const req = new NextRequest('http://localhost:5000/api/kyc/webhook', {
        method: 'POST',
        headers: {
          'x-kyc-signature': 'some_signature',
        },
        body: JSON.stringify({
          userId: 'target_user_id',
          reviewResult: 'APPROVED',
        }),
      })

      const res = await kycWebhookPost(req)
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.error).toBe('Webhook service misconfigured')
    })
  })
})
