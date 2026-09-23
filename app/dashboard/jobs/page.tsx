import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { JobsOverviewClient } from '@/components/dashboard/JobsOverviewClient'

export const dynamic = 'force-dynamic'

export default async function DashboardJobsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  const userId = session.user.id
  const role = session.user.role ?? 'CLIENT'

  let jobs: any[] = []
  let allProposals: any[] = []

  if (userId) {
    try {
      jobs = await db.job.findMany({
        where: role === 'ADMIN' ? undefined : { clientId: userId },
        orderBy: { createdAt: 'desc' },
      })
      allProposals = await db.proposal.findMany({
        include: {
          freelancer: {
            select: { id: true, name: true, image: true, role: true, bio: true, skills: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch {
      jobs = []
    }
  }

  return <JobsOverviewClient jobs={jobs} allProposals={allProposals} />
}