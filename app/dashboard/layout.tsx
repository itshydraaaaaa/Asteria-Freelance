import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  
  // 1. Check if the user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // 👉 2. Added "image" to the select query!
  const { data: profile } = await supabase
    .from('User')
    .select('name, email, role, image')
    .eq('id', user.id)
    .single()

  // 3. Fallbacks just in case the profile is still syncing
  const name     = profile?.name ?? user.user_metadata?.full_name ?? 'User'
  const email    = profile?.email ?? user.email ?? ''
  const role     = profile?.role ?? user.user_metadata?.role ?? 'CLIENT'
  const image    = profile?.image ?? user.user_metadata?.avatar_url ?? null // 👉 Grab the image
  const initials = name[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-ast-surface flex">
      {/* 👉 Pass the image prop to your Nav component */}
      <DashboardNav name={name} email={email} role={role} image={image} initials={initials} />

      <main className="flex-1 ml-64 pt-8 px-8 py-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}