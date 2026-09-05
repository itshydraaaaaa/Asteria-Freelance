/**
 * lib/auth.ts — Asteria Freelance Authentication Helper
 *
 * All authentication verifies strictly against Supabase Auth & Database tables.
 * Zero static mock fallbacks.
 */

import 'server-only'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

import crypto from 'crypto'

export interface AuthSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
    image?: string | null
  }
}

/**
 * Creates a tamper-proof HMAC-signed session token.
 */
export function signSessionToken(userId: string, role: string): string {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error('Authentication secret (JWT_SECRET or SUPABASE_SERVICE_ROLE_KEY) is not configured.')
  }
  const payload = Buffer.from(JSON.stringify({ userId, role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

/**
 * Verifies a tamper-proof HMAC-signed session token.
 */
export function verifySessionToken(token: string): { userId: string; role: string } | null {
  const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret || !token || !token.includes('.')) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expectedSignature)

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
    if (!data.userId || !data.exp || data.exp < Date.now()) {
      return null
    }
    return { userId: data.userId, role: data.role }
  } catch {
    return null
  }
}

export async function auth(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('auth_session_token')?.value

    // 1. Check verified HMAC-signed session token
    if (sessionToken) {
      const verified = verifySessionToken(sessionToken)
      if (verified) {
        const profile = await db.user.findUnique({ where: { id: verified.userId } })
        if (profile) {
          return {
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              image: profile.image ?? null,
            },
          }
        }
      }
    }

    // 2. Real Supabase Auth session
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (!error && user) {
          const profile = (await db.user.findUnique({ where: { id: user.id } })) ||
                          (user.email ? await db.user.findUnique({ where: { email: user.email } }) : null)

          if (!profile) {
            return {
              user: {
                id: user.id,
                email: user.email ?? '',
                name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'User',
                role: user.user_metadata?.role ?? 'CLIENT',
                image: user.user_metadata?.avatar_url ?? user.user_metadata?.image ?? null,
              },
            }
          }

          return {
            user: {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              image: profile.image ?? null,
            },
          }
        }
      } catch (supabaseErr) {
        // Fall through gracefully
      }
    }

    return null
  } catch (err) {
    console.error('[auth] Error in auth() helper:', err)
    return null
  }
}
