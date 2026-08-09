import { createClient } from '@/lib/supabase/server'

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
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null

    // Fetch user profile metadata from DB / table if available
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
