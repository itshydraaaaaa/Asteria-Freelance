import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ResponsiveDashboardWrapper } from '@/components/dashboard/ResponsiveDashboardWrapper'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const name = session.user.name || 'User'
  const email = session.user.email || ''
  const role = session.user.role || 'CLIENT'
  const image = session.user.image || null
  const initials = name[0]?.toUpperCase() ?? 'U'

  return (
    <ResponsiveDashboardWrapper name={name} email={email} role={role} initials={initials} image={image}>
      {children}
    </ResponsiveDashboardWrapper>
  )
}