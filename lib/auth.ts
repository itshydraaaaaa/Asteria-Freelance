/**
 * lib/auth.ts — Asteria Freelance Authentication Helper
 *
 * Primary auth: Supabase Auth (email/magic-link)
 * Dev-only demo auth: cookie `demo_user_id` when ENABLE_DEMO_AUTH=true
 *
 * NEVER set ENABLE_DEMO_AUTH=true in production.
 */

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export interface AuthSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
    image?: string | null
  }
}

export async function auth(): Promise<AuthSession | null> {
  try {
    // ── 1. Demo Auth (dev/testing only) ─────────────────────────────────────
    // Only active when ENABLE_DEMO_AUTH=true — must never be set in production.
    if (process.env.ENABLE_DEMO_AUTH === 'true') {
      const cookieStore = cookies()
      const demoUserId = cookieStore.get('demo_user_id')?.value
      if (demoUserId) {
        const demoUser = await db.user.findUnique({ where: { id: demoUserId } })
        if (demoUser) {
          return {
            user: {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
              role: demoUser.role,
              image: demoUser.image ?? null,
            },
          }
        }
      }
    }

    // ── 2. Real Supabase Auth ────────────────────────────────────────────────
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return null

    // Cross-reference the users table to get role and profile fields
    // (Supabase Auth JWT may not include role — always read from DB)
    const profile = await db.user.findUnique({ where: { id: user.id } })

    if (!profile) {
      // User exists in Auth but not yet in our users table — can happen on
      // first OAuth login. Return minimal session; profile creation handled
      // separately in the onboarding flow.
      return {
        user: {
          id: user.id,
          email: user.email ?? '',
          name: user.user_metadata?.full_name ?? 'New User',
          role: 'CLIENT',
          image: user.user_metadata?.avatar_url ?? null,
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
  } catch (err) {
    console.error('[auth] Error in auth() helper:', err)
    return null
  }
}
