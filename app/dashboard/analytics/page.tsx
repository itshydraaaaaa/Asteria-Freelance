import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { TrendingUp, Eye, MousePointerClick, Users, Star, BarChart2, DollarSign, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function AnalyticsPage() {
  const session = await auth()
  const userId  = session?.user?.id ?? ''
  const role    = session?.user?.role ?? 'FREELANCER'

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

  const kpis = role === 'FREELANCER' ? [
    { label: 'Total Revenue',    value: `${totalEarnings.toLocaleString()} TND`, sub: 'All-time completed', Icon: DollarSign,        color: 'text-emerald-600',  bg: 'bg-emerald-50' },
    { label: 'Completed Orders', value: String(completedOrders.length),        sub: `${orders.length} total contracts`, Icon: CheckCircle,       color: 'text-sky-600',      bg: 'bg-sky-50' },
    { label: 'Fulfillment Rate', value: `${completionRate}%`,                 sub: 'Contract success',   Icon: TrendingUp,        color: 'text-green-600',    bg: 'bg-green-50' },
    { label: 'Active Gigs',      value: String(gigs.length),                   sub: 'Marketplace services', Icon: BarChart2,       color: 'text-ast-primary',  bg: 'bg-ast-primary/10' },
    { label: 'Client Rating',    value: `${avgRating} ★`,                     sub: `${reviews.length} verified reviews`, Icon: Star,   color: 'text-yellow-600',   bg: 'bg-yellow-50' },
    { label: 'Repeat Clients',   value: `${repeatClientsPct}%`,                sub: 'Loyalty index',      Icon: Users,             color: 'text-pink-600',     bg: 'bg-pink-50' },
  ] : [
    { label: 'Escrow Spent',     value: `${totalEarnings.toLocaleString()} TND`, sub: 'Delivered services', Icon: DollarSign,        color: 'text-emerald-600',  bg: 'bg-emerald-50' },
    { label: 'Completed Jobs',   value: String(completedOrders.length),        sub: `${orders.length} total orders`, Icon: CheckCircle,       color: 'text-sky-600',      bg: 'bg-sky-50' },
    { label: 'Success Rate',     value: `${completionRate}%`,                 sub: 'Escrow released',    Icon: TrendingUp,        color: 'text-green-600',    bg: 'bg-green-50' },
    { label: 'Posted Projects',  value: String(jobs.length),                   sub: 'Client briefs',      Icon: BarChart2,         color: 'text-ast-primary',  bg: 'bg-ast-primary/10' },
    { label: 'Active Contracts', value: String(orders.filter(o => o.status === 'ACTIVE').length), sub: 'In progress', Icon: Star,     color: 'text-yellow-600',   bg: 'bg-yellow-50' },
    { label: 'Unique Sellers',   value: String(uniqueClients.size),            sub: 'Hired talent',       Icon: Users,             color: 'text-pink-600',     bg: 'bg-pink-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-bold text-3xl text-black">Workspace Analytics</h1>
        <p className="text-ast-gray text-xs mt-1">Live performance metrics computed from your contracts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map(({ label, value, sub, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-3xl border border-black/8 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="font-heading font-bold text-2xl text-black">{value}</p>
            <p className="text-ast-gray text-xs uppercase tracking-wider mt-0.5">{label}</p>
            <p className="text-ast-gray text-[11px] mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-1">
            {role === 'FREELANCER' ? 'Revenue (TND)' : 'Escrow Spend (TND)'}
          </h3>
          <p className="text-ast-gray text-xs mb-4">Actual financial flow from delivered milestones</p>
          <DashboardChart data={earningsSeries} color="#11606e" label="TND" />
        </div>

        <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-1">Contracts Volume</h3>
          <p className="text-ast-gray text-xs mb-4">Total orders processed per month</p>
          <DashboardChart data={ordersSeries} color="#4CB4E7" label="Contracts" />
        </div>
      </div>
    </div>
  )
}
