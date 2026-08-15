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

    if (process.env.NODE_ENV !== 'production') {
      const fallbackAdmin = await db.user.findUnique({ where: { id: 'admin1' } })
      if (fallbackAdmin) {
        return {
          user: {
            id: fallbackAdmin.id,
            email: fallbackAdmin.email,
            name: fallbackAdmin.name,
            role: fallbackAdmin.role,
            image: fallbackAdmin.image ?? null,
          },
        }
      }
    }

    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return null

    const { data: profile } = await supabase
      .from('User')
      .select('name, email, role, image')
      .eq('id', user.id)
      .single()

    return {
      user: {
        id: user.id,
        email: profile?.email ?? user.email ?? '',
        name: profile?.name ?? user.user_metadata?.full_name ?? 'User',
        role: profile?.role ?? user.user_metadata?.role ?? 'CLIENT',
        image: profile?.image ?? user.user_metadata?.avatar_url ?? null,
      },
    }
  } catch (err) {
    console.error('Error in auth() helper:', err)
    return null
  }
}
