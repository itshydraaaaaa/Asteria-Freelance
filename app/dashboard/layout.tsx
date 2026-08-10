import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const demoUserId = cookieStore.get('demo_user_id')?.value

  let name = 'Admin Master'
  let email = 'admin.master@asteria.com'
  let role = 'ADMIN'
  let image: string | null = null

  if (demoUserId) {
    const dbUser = await db.user.findUnique({ where: { id: demoUserId } })
    if (dbUser) {
      name = dbUser.name
      email = dbUser.email
      role = dbUser.role
      image = dbUser.image ?? null
    }
  } else {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        email = user.email ?? ''
        name = user.user_metadata?.full_name ?? 'User'
        role = user.user_metadata?.role ?? 'CLIENT'

        const { data: profile } = await supabase
          .from('User')
          .select('name, email, role, image')
          .eq('id', user.id)
          .single()

        if (profile) {
          name = profile.name ?? name
          email = profile.email ?? email
          role = profile.role ?? role
          image = profile.image ?? null
        }
      } else {
        // Fallback for demo testing
        const defaultAdmin = await db.user.findUnique({ where: { id: 'admin1' } })
        if (defaultAdmin) {
          name = defaultAdmin.name
          email = defaultAdmin.email
          role = defaultAdmin.role
          image = defaultAdmin.image ?? null
        }
      }
    } catch (e) {
      const defaultAdmin = await db.user.findUnique({ where: { id: 'admin1' } })
      if (defaultAdmin) {
        name = defaultAdmin.name
        email = defaultAdmin.email
        role = defaultAdmin.role
        image = defaultAdmin.image ?? null
      }
    }
  }

  const initials = name[0]?.toUpperCase() ?? 'A'

  return (
    <div className="min-h-screen bg-ast-surface">
      <div className="flex min-h-screen overflow-hidden">
        <DashboardNav name={name} email={email} role={role} image={image} initials={initials} />

        <main className="flex-1 min-h-screen overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}