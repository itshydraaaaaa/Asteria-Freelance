/**
 * lib/authz.ts — Server-Side Authorization Helpers
 *
 * Every API route that touches sensitive data MUST call one of these
 * helpers before doing anything else. They throw with the correct HTTP
 * status so route handlers can simply `return authz.requireAdmin(session)`
 * and get a ready NextResponse.
 *
 * Pattern:
 *   const session = await auth()
 *   const authzError = requireAuth(session) ?? requireRole(session, 'ADMIN')
 *   if (authzError) return authzError
 */

import { NextResponse } from 'next/server'
import type { AuthSession } from '@/lib/auth'
import type { OrderRecord } from '@/lib/db'

// ─── requireAuth ──────────────────────────────────────────────────────────────
/**
 * Returns a 401 response if the session is null (not authenticated).
 * Returns null if authenticated (caller can proceed).
 */
export function requireAuth(session: AuthSession | null): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return null
}

// ─── requireRole ─────────────────────────────────────────────────────────────
/**
 * Returns a 403 response if the session user does not have the required role.
 * Returns null if authorized.
 */
export function requireRole(
  session: AuthSession | null,
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN'
): NextResponse | null {
  const authError = requireAuth(session)
  if (authError) return authError

  if ((session!.user as any).role !== role) {
    return NextResponse.json(
      { error: `Forbidden: ${role} role required` },
      { status: 403 }
    )
  }
  return null
}

// ─── requireOrderParty ────────────────────────────────────────────────────────
/**
 * Returns a 403 response if the session user is neither the buyer nor the
 * seller on the given order. Returns null if authorized.
 */
export function requireOrderParty(
  session: AuthSession | null,
  order: OrderRecord
): NextResponse | null {
  const authError = requireAuth(session)
  if (authError) return authError

  const userId = session!.user.id
  if (userId !== order.buyerId && userId !== order.sellerId) {
    return NextResponse.json(
      { error: 'Forbidden: you are not a party to this order' },
      { status: 403 }
    )
  }
  return null
}

// ─── requireOrderBuyer ───────────────────────────────────────────────────────
/**
 * Returns a 403 if the session user is not the buyer on this order.
 */
export function requireOrderBuyer(
  session: AuthSession | null,
  order: OrderRecord
): NextResponse | null {
  const authError = requireAuth(session)
  if (authError) return authError

  if (session!.user.id !== order.buyerId) {
    return NextResponse.json(
      { error: 'Forbidden: only the buyer can perform this action' },
      { status: 403 }
    )
  }
  return null
}

// ─── requireOrderSeller ──────────────────────────────────────────────────────
/**
 * Returns a 403 if the session user is not the seller on this order.
 */
export function requireOrderSeller(
  session: AuthSession | null,
  order: OrderRecord
): NextResponse | null {
  const authError = requireAuth(session)
  if (authError) return authError

  if (session!.user.id !== order.sellerId) {
    return NextResponse.json(
      { error: 'Forbidden: only the seller can perform this action' },
      { status: 403 }
    )
  }
  return null
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
/**
 * Shorthand for requireRole(session, 'ADMIN').
 */
export function requireAdmin(session: AuthSession | null): NextResponse | null {
  return requireRole(session, 'ADMIN')
}
