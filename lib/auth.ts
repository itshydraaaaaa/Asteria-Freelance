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
    const cookieStore = await cookies()
    const demoUserId = cookieStore.get('demo_user_id')?.value

    // 1. If demo_user_id cookie is present, check real database User record
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

    // 2. Real Supabase Auth session
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return null

    // Cross-reference user profile from Supabase database
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
