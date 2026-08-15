import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { dashboardData }  from '@/lib/data/dashboard'
import Link from 'next/link'
import { Briefcase, Star, Plus, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id ?? ''
  const role = session?.user?.role ?? 'FREELANCER'
  const name = session?.user?.name ?? 'User'

  let orders: any[] = []
  let earnings = 0

  if (userId) {
    try {
      orders = await db.order.findMany({
        where: role === 'FREELANCER' ? { sellerId: userId } : { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      earnings = orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.amount, 0)
    } catch {
      orders = []
    }
  }

  const activeOrders    = orders.filter(o => o.status === 'ACTIVE').length
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length
  const completionRate  = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 100

  const metrics = role === 'FREELANCER' ? [
    { label: 'Total Earnings',   value: `$${earnings.toLocaleString()}`, sub: 'All time payouts' },
    { label: 'Active Orders',    value: String(activeOrders),            sub: 'In progress' },
    { label: 'Completion Rate',  value: `${completionRate}%`,            sub: 'Order fulfillment' },
    { label: 'Profile Views',    value: '1,284',                         sub: 'This month' },
  ] : [
    { label: 'Total Spent',      value: `$${earnings.toLocaleString()}`, sub: 'Escrow funded' },
    { label: 'Active Orders',    value: String(activeOrders),            sub: 'In progress' },
    { label: 'Completed Jobs',   value: String(completedOrders),         sub: 'Delivered services' },
    { label: 'Saved Freelancers',value: '8',                             sub: 'Favorite talent' },
  ]

  const STATUS_BADGE: Record<string, string> = {
    PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
    ACTIVE:    'bg-ast-primary text-white',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
  }

  return (
    <div className="space-y-6">
      {/* Role-Specific Header Banner */}
      <div className="rounded-[28px] border border-black/8 bg-gradient-to-br from-[#0a3a40] via-[#11606e] to-[#60c8d4] p-8 text-white shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.35em] bg-white/15 px-3 py-1 rounded-full text-white/90">
                {role === 'FREELANCER' ? 'Freelancer Workspace' : 'Client Workspace'}
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-white">Welcome back, {name}!</h1>
            <p className="mt-2 max-w-xl text-sm text-white/85 leading-relaxed">
              {role === 'FREELANCER' 
                ? 'Offer your custom services, manage incoming orders, and browse open client projects.' 
                : 'Post new project briefs, explore top MENA freelancer services, and manage your escrow orders.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {role === 'FREELANCER' ? (
              <>
                <Link
                  href="/jobs"
                  className="flex items-center gap-2 bg-white text-ast-dark px-5 py-2.5 rounded-full text-xs font-bold hover:bg-ast-surface transition-colors shadow-sm"
                >
                  <Briefcase size={14} /> Browse Open Jobs
                </Link>
                <Link
                  href="/dashboard/gigs/new"
                  className="flex items-center gap-2 border border-white/30 bg-white/10 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <Plus size={14} /> Post a New Gig
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/explore"
                  className="flex items-center gap-2 bg-white text-ast-dark px-5 py-2.5 rounded-full text-xs font-bold hover:bg-ast-surface transition-colors shadow-sm"
                >
                  <Star size={14} /> Explore Freelancer Gigs
                </Link>
                <Link
                  href="/post-job"
                  className="flex items-center gap-2 border border-white/30 bg-white/10 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <Plus size={14} /> Post a Project Brief
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <DashboardStats metrics={metrics} />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardChart data={dashboardData.monthlyEarnings} />
        <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-4">Platform Activity Trends</h3>
          <DashboardChart data={dashboardData.profileViews} color="#4CB4E7" label="Activity" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-black text-lg">
            {role === 'FREELANCER' ? 'Recent Freelance Orders' : 'My Placed Escrow Orders'}
          </h3>
          <Link href="/dashboard/orders" className="text-xs font-semibold text-ast-primary flex items-center gap-1 hover:underline">
            View All Orders <ArrowRight size={13} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-ast-gray text-sm">
              No orders found in your workspace history.
            </p>
            {role === 'FREELANCER' ? (
              <Link href="/jobs" className="inline-block bg-ast-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ast-dark transition-colors">
                Browse Open Client Jobs
              </Link>
            ) : (
              <Link href="/explore" className="inline-block bg-ast-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ast-dark transition-colors">
                Explore Marketplace Gigs
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-4 py-3 font-medium">Gig Service</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-4 py-4 font-medium text-black">{o.gig?.title ?? 'Custom Service Order'}</td>
                    <td className="px-4 py-4 text-black font-semibold">${o.amount}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-semibold ${STATUS_BADGE[o.status] ?? ''}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-ast-gray text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}