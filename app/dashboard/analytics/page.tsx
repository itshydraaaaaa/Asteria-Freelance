import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { redirect } from 'next/navigation'
import { AnalyticsOverviewClient } from '@/components/dashboard/AnalyticsOverviewClient'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  const userId  = session.user.id
  const role    = session.user.role ?? 'FREELANCER'

  let orders: any[] = []
  let gigs: any[] = []
  let jobs: any[] = []
  let reviews: any[] = []

  try {
    orders = await db.order.findMany({
      where: role === 'FREELANCER' ? { sellerId: userId } : { buyerId: userId },
    })

    if (role === 'FREELANCER') {
      gigs = await db.gig.findMany({ where: { freelancerId: userId } })
      reviews = await db.review.findMany({ where: { freelancerId: userId } })
    } else {
      jobs = await db.job.findMany({ where: { clientId: userId } })
    }
  } catch {}

  const completedOrders = orders.filter(o => o.status === 'COMPLETED')
  const totalEarnings   = completedOrders.reduce((s, o) => s + Number(o.amount || 0), 0)
  const completionRate  = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0

  // Calculate real monthly series for the last 6 months
  const now = new Date()
  const earningsSeries = []
  const ordersSeries = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mIdx = d.getMonth()
    const yIdx = d.getFullYear()
    const label = MONTHS[mIdx]

    const mOrders = orders.filter(o => {
      const od = new Date(o.createdAt)
      return od.getMonth() === mIdx && od.getFullYear() === yIdx
    })

    const mEarnings = mOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((s, o) => s + Number(o.amount || 0), 0)

    earningsSeries.push({ month: label, value: mEarnings })
    ordersSeries.push({ month: label, value: mOrders.length })
  }

  // Calculate unique repeat clients
  const clientIds = orders.map(o => o.buyerId).filter(Boolean)
  const uniqueClients = new Set(clientIds)
  const repeatClientsPct = clientIds.length > 1
    ? Math.round(((clientIds.length - uniqueClients.size) / clientIds.length) * 100)
    : (orders.length > 0 ? 100 : 0)

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : '5.0'

  return (
    <AnalyticsOverviewClient
      role={role}
      totalEarnings={totalEarnings}
      completedOrdersCount={completedOrders.length}
      totalOrdersCount={orders.length}
      completionRate={completionRate}
      gigsCount={gigs.length}
      avgRating={avgRating}
      reviewsCount={reviews.length}
      repeatClientsPct={repeatClientsPct}
      jobsCount={jobs.length}
      activeOrdersCount={orders.filter(o => o.status === 'ACTIVE').length}
      uniqueClientsCount={uniqueClients.size}
      earningsSeries={earningsSeries}
      ordersSeries={ordersSeries}
    />
  )
}
