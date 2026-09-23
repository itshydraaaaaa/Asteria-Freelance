import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { DashboardOverviewClient } from '@/components/dashboard/DashboardOverviewClient'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  const userId = session.user.id
  const role = session.user.role ?? 'FREELANCER'
  const name = session.user.name ?? 'User'

  let orders: any[] = []
  let gigs: any[] = []
  let jobs: any[] = []
  let myProposals: any[] = []
  let earnings = 0

  if (userId) {
    try {
      orders = await db.order.findMany({
        where: role === 'FREELANCER' ? { sellerId: userId } : { buyerId: userId },
        include: { gig: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      })
      earnings = orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + Number(o.amount || 0), 0)

      gigs = await db.gig.findMany({ where: { freelancerId: userId } })
      jobs = await db.job.findMany({
        where: role === 'ADMIN' ? undefined : { clientId: userId },
        include: { _count: { select: { proposals: true } } },
        orderBy: { createdAt: 'desc' },
      })
      myProposals = await db.proposal.findMany({
        where: { freelancerId: userId },
        orderBy: { createdAt: 'desc' },
      })
    } catch {
      orders = []
    }
  }

  const activeOrders    = orders.filter(o => o.status === 'ACTIVE' || o.status === 'PENDING').length
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length
  const completionRate  = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : (completedOrders > 0 ? 100 : 0)

  // Compute real monthly chart series based on authentic orders
  const now = new Date()
  const monthlyChartData = []
  const monthlyVolumeData = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = d.getMonth()
    const yearKey = d.getFullYear()
    const monthLabel = MONTH_NAMES[monthKey]

    const monthOrders = orders.filter(o => {
      const od = new Date(o.createdAt)
      return od.getMonth() === monthKey && od.getFullYear() === yearKey
    })

    const monthRevenue = monthOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.amount || 0), 0)

    monthlyChartData.push({
      month: monthLabel,
      value: monthRevenue,
    })

    monthlyVolumeData.push({
      month: monthLabel,
      value: monthOrders.length,
    })
  }

  return (
    <DashboardOverviewClient
      name={name}
      role={role}
      earnings={earnings}
      activeOrders={activeOrders}
      completedOrders={completedOrders}
      completionRate={completionRate}
      gigsCount={gigs.length}
      jobsCount={jobs.length}
      monthlyChartData={monthlyChartData}
      monthlyVolumeData={monthlyVolumeData}
      jobs={jobs}
      myProposals={myProposals}
      orders={orders}
    />
  )
}