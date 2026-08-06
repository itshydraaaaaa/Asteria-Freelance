import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/dashboard/ProfileForm'

export default async function ProfilePage() {
  const supabase = createClient()
  
  // 1. Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch their full profile from our native Supabase table
  let dbUser: any = null
  try {
    const { data } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single()
      
    dbUser = data
  } catch (error) {
    console.error("Failed to fetch user profile:", error)
  }

  // 3. Fallback structure to prevent the form from crashing if it's a brand new user
  const profile = dbUser ?? {
    name: user.user_metadata?.full_name ?? '',
    email: user.email ?? '',
    bio: '',
    skills: [] as string[],
    hourlyRate: null,
    role: user.user_metadata?.role ?? 'CLIENT',
    walletBalance: 0,
    location: '',
    website: '',
    languages: [],
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-3xl text-black mb-8">Profile</h1>
      <ProfileForm profile={profile} />
    </div>
  )
}