import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/dashboard/ProfileForm'

export default async function ProfilePage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect('/login')
  }

  let dbUser: any = null
  try {
    dbUser = await db.user.findUnique({ where: { id: userId } })
    if (!dbUser) {
      const supabase = await createClient()
      const { data } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) dbUser = data
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error)
  }

  const profile = dbUser ?? {
    name: session?.user?.name ?? 'User',
    email: session?.user?.email ?? '',
    bio: 'Experienced independent professional.',
    skills: ['TypeScript', 'Next.js', 'UI/UX'] as string[],
    hourlyRate: 65,
    role: session?.user?.role ?? 'CLIENT',
    walletBalance: 0,
    location: 'Tunis, Tunisia',
    website: 'https://asteria.com',
    languages: ['Arabic', 'English', 'French'],
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-3xl text-black mb-8">Profile Settings</h1>
      <ProfileForm profile={profile} />
    </div>
  )
}