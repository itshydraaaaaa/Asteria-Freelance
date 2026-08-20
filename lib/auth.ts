/**
 * lib/auth.ts — Asteria Freelance Authentication Helper
 *
 * Primary auth: Supabase Auth (email/magic-link)
 * Dev-only demo auth: cookie `demo_user_id` when ENABLE_DEMO_AUTH=true
 */

import 'server-only'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { DEMO_USERS } from '@/lib/data/demoUsers'

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
    // ── 1. Demo Auth (enabled by default unless explicitly disabled) ────────
    if (process.env.ENABLE_DEMO_AUTH !== 'false') {
      const cookieStore = cookies()
      const demoUserId = cookieStore.get('demo_user_id')?.value
      if (demoUserId) {
        // First check static pre-seeded demo users for instant zero-latency login
        const staticDemo = DEMO_USERS[demoUserId]
        if (staticDemo) {
          return {
            user: {
              id: staticDemo.id,
              email: staticDemo.email,
              name: staticDemo.name,
              role: staticDemo.role,
              image: staticDemo.image ?? null,
            },
          }
        }

        // Otherwise check DB
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

    // Cross-reference user profile by ID or Email
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
  } catch (err) {
    console.error('[auth] Error in auth() helper:', err)
    return null
  }
}
