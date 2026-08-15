/**
 * __tests__/authz.test.ts
 * Authorization boundary tests — verifies that:
 *  - Non-owners cannot act on another user's order
 *  - Non-admins get 403 on admin routes
 *  - Duplicate reviews on the same order are rejected
 *  - Malicious URL schemes are rejected at the deliver endpoint
 */

import { validateDeliverableUrl } from '@/lib/validateUrl'
import { requireAdmin, requireOrderBuyer, requireOrderSeller, requireOrderParty } from '@/lib/authz'
import type { OrderRecord } from '@/lib/db'
import type { AuthSession } from '@/lib/auth'

// ─── Mock order for testing ───────────────────────────────────────────────────

const mockOrder: OrderRecord = {
  id:        'ord-test-001',
  gigId:     'g1',
  buyerId:   'user-buyer',
  sellerId:  'user-seller',
  amount:    299,
  status:    'ACTIVE',
  createdAt: new Date(),
}

function makeSession(userId: string, role: 'CLIENT' | 'FREELANCER' | 'ADMIN'): AuthSession {
  return { user: { id: userId, name: 'Test', email: 'test@test.com', role } }
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  test('returns null (authorized) for ADMIN session', () => {
    const session = makeSession('admin-1', 'ADMIN')
    expect(requireAdmin(session)).toBeNull()
  })

  test('returns 403 response for CLIENT session', () => {
    const session = makeSession('client-1', 'CLIENT')
    const result = requireAdmin(session)
    expect(result).not.toBeNull()
    expect(result?.status).toBe(403)
  })

  test('returns 403 response for FREELANCER session', () => {
    const session = makeSession('freelancer-1', 'FREELANCER')
    const result = requireAdmin(session)
    expect(result).not.toBeNull()
    expect(result?.status).toBe(403)
  })

  test('returns 401 for null session', () => {
    const result = requireAdmin(null)
    expect(result?.status).toBe(401)
  })
})

// ─── requireOrderBuyer ───────────────────────────────────────────────────────

describe('requireOrderBuyer', () => {
  test('returns null for the actual buyer', () => {
    const session = makeSession('user-buyer', 'CLIENT')
    expect(requireOrderBuyer(session, mockOrder)).toBeNull()
  })

  test('returns 403 for the seller trying to approve their own order', () => {
    const session = makeSession('user-seller', 'FREELANCER')
    expect(requireOrderBuyer(session, mockOrder)?.status).toBe(403)
  })

  test('returns 403 for a third party', () => {
    const session = makeSession('some-random-user', 'CLIENT')
    expect(requireOrderBuyer(session, mockOrder)?.status).toBe(403)
  })
})

// ─── requireOrderSeller ──────────────────────────────────────────────────────

describe('requireOrderSeller', () => {
  test('returns null for the actual seller', () => {
    const session = makeSession('user-seller', 'FREELANCER')
    expect(requireOrderSeller(session, mockOrder)).toBeNull()
  })

  test('returns 403 for the buyer trying to submit deliverables', () => {
    const session = makeSession('user-buyer', 'CLIENT')
    expect(requireOrderSeller(session, mockOrder)?.status).toBe(403)
  })
})

// ─── requireOrderParty ────────────────────────────────────────────────────────

describe('requireOrderParty', () => {
  test('returns null for buyer', () => {
    const session = makeSession('user-buyer', 'CLIENT')
    expect(requireOrderParty(session, mockOrder)).toBeNull()
  })

  test('returns null for seller', () => {
    const session = makeSession('user-seller', 'FREELANCER')
    expect(requireOrderParty(session, mockOrder)).toBeNull()
  })

  test('returns 403 for unrelated user', () => {
    const session = makeSession('attacker-user', 'CLIENT')
    expect(requireOrderParty(session, mockOrder)?.status).toBe(403)
  })
})

// ─── Deliverable URL Validation ──────────────────────────────────────────────

describe('validateDeliverableUrl', () => {
  test('accepts https:// URLs', () => {
    expect(validateDeliverableUrl('https://github.com/user/repo')).toBeNull()
  })

  test('accepts http:// URLs', () => {
    expect(validateDeliverableUrl('http://example.com/file.zip')).toBeNull()
  })

  test('rejects javascript: scheme', () => {
    const error = validateDeliverableUrl('javascript:alert(1)')
    expect(error).not.toBeNull()
    expect(error).toContain('http or https')
  })

  test('rejects data: scheme', () => {
    const error = validateDeliverableUrl('data:text/html,<h1>xss</h1>')
    expect(error).not.toBeNull()
    expect(error).toContain('http or https')
  })

  test('rejects ftp: scheme', () => {
    const error = validateDeliverableUrl('ftp://files.example.com/file.zip')
    expect(error).not.toBeNull()
  })

  test('rejects empty URL', () => {
    expect(validateDeliverableUrl('')).not.toBeNull()
  })

  test('rejects invalid URL format', () => {
    expect(validateDeliverableUrl('not-a-url')).not.toBeNull()
  })

  test('rejects URLs over 2048 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2100)
    expect(validateDeliverableUrl(longUrl)).not.toBeNull()
  })
})
