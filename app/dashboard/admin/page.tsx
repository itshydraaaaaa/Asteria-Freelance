import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { redirect } from 'next/navigation'

const ROLE_BADGE: Record<string, string> = {
  CLIENT:     'bg-blue-50 text-blue-700 border border-blue-200',
  FREELANCER: 'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  ADMIN:      'bg-ast-dark text-white',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  ACTIVE:    'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
}

export default async function AdminPage() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/dashboard')

  const [users, orders, gigs] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
    db.order.findMany({ include: { gig: true, buyer: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
    db.gig.findMany({ include: { freelancer: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
  ])

  const totalEarnings = (orders as any[]).filter((o: any) => o.status === 'COMPLETED').reduce((s: number, o: any) => s + o.amount, 0)

  const stats = [
    { label: 'Total Users',    value: String(users.length),                 sub: `${(users as any[]).filter((u: any) => u.role === 'FREELANCER').length} freelancers` },
    { label: 'Total Orders',   value: String(orders.length),                sub: `${(orders as any[]).filter((o: any) => o.status === 'ACTIVE').length} active` },
    { label: 'Total Gigs',     value: String(gigs.length),                  sub: 'listed on platform' },
    { label: 'Total Earnings', value: `$${totalEarnings.toLocaleString()}`, sub: 'completed orders' },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-ast-dark flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60c8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">Admin Panel</h1>
          <p className="text-ast-gray text-sm">Platform overview and management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/8 p-5 border-l-[3px] border-l-ast-dark">
            <p className="text-ast-gray text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className="font-heading font-bold text-2xl text-black">{s.value}</p>
            <p className="text-ast-gray text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
            <h2 className="font-semibold text-black">Users</h2>
            <span className="text-xs text-ast-gray bg-ast-surface rounded-full px-2 py-0.5">{users.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(users as any[]).map((u: any) => (
                  <tr key={u.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-ast-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-black truncate max-w-[100px]">{u.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ast-gray text-xs truncate max-w-[140px]">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${ROLE_BADGE[u.role] ?? ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ast-gray text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-ast-gray text-sm">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
            <h2 className="font-semibold text-black">Recent Orders</h2>
            <span className="text-xs text-ast-gray bg-ast-surface rounded-full px-2 py-0.5">{orders.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Gig</th>
                  <th className="px-5 py-3 font-medium">Buyer</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {(orders as any[]).map((o: any) => (
                  <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-black truncate max-w-[120px]">{o.gig?.title ?? '—'}</td>
                    <td className="px-5 py-3 text-ast-gray text-xs">{o.buyer?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-black font-medium">${o.amount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_BADGE[o.status] ?? ''}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-ast-gray text-sm">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
          <h2 className="font-semibold text-black">Gigs</h2>
          <span className="text-xs text-ast-gray bg-ast-surface rounded-full px-2 py-0.5">{gigs.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Freelancer</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {(gigs as any[]).map((g: any) => (
                <tr key={g.id} className="hover:bg-ast-surface/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-black truncate max-w-[200px]">{g.title}</td>
                  <td className="px-5 py-3 text-ast-gray text-xs">{g.category}</td>
                  <td className="px-5 py-3 text-ast-gray text-xs">{g.freelancer?.name ?? '—'}</td>
                  <td className="px-5 py-3 font-medium text-black">${g.price}</td>
                  <td className="px-5 py-3">
                    {g.featured
                      ? <span className="text-[10px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5">Featured</span>
                      : <span className="text-[10px] text-ast-gray">—</span>
                    }
                  </td>
                </tr>
              ))}
              {gigs.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ast-gray text-sm">No gigs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
