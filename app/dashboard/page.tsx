import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import Link from 'next/link'
import { Briefcase, Star, Plus, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id ?? ''
  const role = session?.user?.role ?? 'FREELANCER'
  const name = session?.user?.name ?? 'User'

  let orders: any[] = []
  let gigs: any[] = []
  let jobs: any[] = []
  let earnings = 0

  if (userId) {
    try {
      orders = await db.order.findMany({
        where: role === 'FREELANCER' ? { sellerId: userId } : { buyerId: userId },
      })
      earnings = orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + Number(o.amount || 0), 0)

      if (role === 'FREELANCER') {
        gigs = await db.gig.findMany({ where: { freelancerId: userId } })
      } else {
        jobs = await db.job.findMany({ where: { clientId: userId } })
      }
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

  const metrics = role === 'FREELANCER' ? [
    { label: 'Total Earnings',   value: `${earnings.toLocaleString()} TND`, sub: 'Completed contracts' },
    { label: 'Active Orders',    value: String(activeOrders),            sub: 'In progress' },
    { label: 'Completion Rate',  value: `${completionRate}%`,            sub: 'Order fulfillment' },
    { label: 'Published Gigs',   value: String(gigs.length),             sub: 'Active marketplace services' },
  ] : [
    { label: 'Total Escrow Spent', value: `${earnings.toLocaleString()} TND`, sub: 'Completed deliveries' },
    { label: 'Active Contracts', value: String(activeOrders),            sub: 'In progress' },
    { label: 'Completed Jobs',   value: String(completedOrders),         sub: 'Delivered services' },
    { label: 'Posted Projects',  value: String(jobs.length),             sub: 'Client briefs open' },
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
        <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-1">
            {role === 'FREELANCER' ? 'Monthly Revenue (TND)' : 'Monthly Escrow Spend (TND)'}
          </h3>
          <p className="text-ast-gray text-xs mb-4">Actual value of completed milestones</p>
          <DashboardChart data={monthlyChartData} color="#11606e" label="Revenue (TND)" />
        </div>

        <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-black mb-1">Order Volume Trend</h3>
          <p className="text-ast-gray text-xs mb-4">Total contracts placed per month</p>
          <DashboardChart data={monthlyVolumeData} color="#4CB4E7" label="Orders" />
        </div>
      </div>

      {/* Client Posted Jobs Section */}
      {role !== 'FREELANCER' && (
        <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-black text-lg">My Posted Projects & Applications</h3>
              <p className="text-ast-gray text-xs">Manage your job listings and browse received freelancer proposals</p>
            </div>
            <Link href="/post-job" className="bg-ast-primary text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-ast-dark transition-colors flex items-center gap-1.5 shadow-xs">
              <Plus size={14} /> Post New Job
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="py-8 text-center space-y-3 bg-ast-surface/40 rounded-2xl border border-black/5">
              <p className="text-ast-gray text-xs">You haven't posted any client jobs yet.</p>
              <Link href="/post-job" className="inline-block bg-ast-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ast-dark transition-colors">
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                    <th className="px-4 py-3 font-medium">Job Title</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Budget</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Proposals</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {jobs.map(j => (
                    <tr key={j.id} className="hover:bg-ast-surface/40 transition-colors">
                      <td className="px-4 py-4 font-semibold text-black">
                        <Link href={`/jobs/${j.id}`} className="hover:text-ast-primary transition-colors">
                          {j.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-xs text-ast-gray">{j.category}</td>
                      <td className="px-4 py-4 text-black font-bold">{j.budget} TND</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block text-[11px] rounded-full px-2.5 py-0.5 font-bold ${
                          j.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-black/8 text-ast-gray'
                        }`}>
                          {j.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-ast-primary">
                        {j._count?.proposals ?? 0} application{(j._count?.proposals ?? 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/jobs/${j.id}`}
                          className="px-3.5 py-1.5 bg-ast-surface border border-black/10 rounded-xl text-xs font-bold text-ast-primary hover:bg-ast-primary hover:text-white transition-colors inline-block"
                        >
                          Manage Applications →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
            <p className="text-ast-gray text-xs">
              No active or completed orders found in your workspace history.
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
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-4 py-4 font-medium text-black">
                      <Link href={`/dashboard/orders/${o.id}`} className="hover:text-ast-primary transition-colors">
                        {o.gig?.title ?? `Order #${o.id.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-black font-bold">{o.amount} TND</td>
                    <td className="px-4 py-4">
                      <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-bold ${STATUS_BADGE[o.status] ?? ''}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-ast-gray text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="text-xs font-bold text-ast-primary hover:underline"
                      >
                        Workspace →
                      </Link>
                    </td>
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