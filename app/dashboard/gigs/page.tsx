import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { GigsOverviewClient } from '@/components/dashboard/GigsOverviewClient'

export const dynamic = 'force-dynamic'

export default async function DashboardGigsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect('/login')
  }

  let gigs: any[] = []
  try {
    gigs = await db.gig.findMany({ where: { freelancerId: userId }, orderBy: { createdAt: 'desc' } })
  } catch (error) {
    console.error("Failed to fetch gigs:", error)
  }

  return <GigsOverviewClient gigs={gigs} />
}