import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { dashboardData }  from '@/lib/data/dashboard'

export default async function DashboardPage() {
  // 👉 1. Use Supabase to get the currently authenticated user securely
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId  = user?.id ?? ''

  let orders: any[] = []
  let earnings = 0

  if (userId) {
    try {
      // 👉 2. Use Supabase to fetch the user's orders instead of Prisma
      const { data, error } = await supabase
        .from('Order')
        .select('*, Gig(title)')
        .eq('sellerId', userId)
        .order('createdAt', { ascending: false })
        .limit(10)

      if (data) {
        // Map the Supabase join result so it perfectly matches your existing UI components
        orders = data.map((o: any) => ({
          ...o,
          gig: o.Gig ? (Array.isArray(o.Gig) ? o.Gig[0] : o.Gig) : null
        }))
        earnings = orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.amount, 0)
      }
    } catch {
      orders = []
    }
  }

  const activeOrders    = orders.filter(o => o.status === 'ACTIVE').length
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length
  const completionRate  = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0

  const metrics = [
    { label: 'Total Earnings',   value: `$${earnings.toLocaleString()}`, sub: 'All time' },
    { label: 'Active Orders',    value: String(activeOrders),            sub: 'In progress' },
    { label: 'Completion Rate',  value: `${completionRate}%`,            sub: 'All orders' },
    { label: 'Profile Views',    value: '1,284',                         sub: 'This month' },
  ]

  const STATUS_BADGE: Record<string, string> = {
    PENDING:   'bg-black/8 text-black border border-black/15',
    ACTIVE:    'bg-ast-primary text-white',
    COMPLETED: 'bg-ast-muted text-ast-primary border border-ast-light/40',
    CANCELLED: 'bg-black text-white',
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-3xl text-black mb-8">Dashboard</h1>

      <DashboardStats metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DashboardChart data={dashboardData.monthlyEarnings} />
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <h3 className="font-semibold text-black mb-4">Profile Views</h3>
          <DashboardChart data={dashboardData.profileViews} color="#4CB4E7" label="Views" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <h3 className="font-semibold text-black mb-5">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="text-ast-gray text-sm text-center py-8">No orders yet. <a href="/explore" className="text-ast-primary hover:underline">Browse gigs</a> to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Gig</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="py-3 font-medium text-black">{o.gig?.title ?? '—'}</td>
                    <td className="py-3 text-ast-gray">${o.amount}</td>
                    <td className="py-3">
                      <span className={`inline-block text-xs rounded-full px-2.5 py-1 font-medium ${STATUS_BADGE[o.status] ?? ''}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-ast-gray">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* If no orders are found, we render the sample UI you already had built! */}
        {orders.length === 0 && (
          <div className="mt-8 border-t border-black/8 pt-6">
            <h4 className="font-semibold text-black mb-3 text-sm">Sample Data</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-black/5">
                  {dashboardData.recentOrders.map(o => (
                    <tr key={o.id}>
                      <td className="py-3 font-medium text-black">{o.gigTitle}</td>
                      <td className="py-3 text-ast-gray">${o.amount}</td>
                      <td className="py-3">
                        <span className={`inline-block text-xs rounded-full px-2.5 py-1 font-medium ${STATUS_BADGE[o.status] ?? ''}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-ast-gray">{o.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}