import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { dashboardData } from '@/lib/data/dashboard'

export default async function OrdersPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect('/login')
  }

  let orders: any[] = []

  try {
    const buyerOrders = await db.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: 'desc' },
    })
    const sellerOrders = await db.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
    })
    
    // Combine and deduplicate
    const map = new Map()
    buyerOrders.forEach((o: any) => map.set(o.id, o))
    sellerOrders.forEach((o: any) => map.set(o.id, o))
    orders = Array.from(map.values()).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  }

  const STATUS_BADGE: Record<string, string> = {
    PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
    ACTIVE:    'bg-ast-primary text-white',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">My Orders</h1>
          <p className="text-ast-gray text-sm mt-1">Track active orders, deliveries, and past completed projects</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/8 p-6 shadow-sm">
        {orders.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-ast-gray text-sm">
              You don't have any active or completed orders yet.
            </p>
            <a href="/explore" className="inline-block bg-ast-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-ast-dark transition-colors">
              Browse Marketplace Gigs
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-4 py-3 font-medium">Gig Service</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => {
                  const isBuyer = o.buyerId === userId
                  return (
                    <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                      <td className="px-4 py-4 font-medium text-black">
                        <div className="flex items-center gap-3">
                          {o.gig?.thumbnail && (
                            <img src={o.gig.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover border border-black/10" />
                          )}
                          <span className="truncate max-w-xs">{o.gig?.title ?? 'Custom Gig Order'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-ast-gray text-xs font-medium">
                        {isBuyer ? (
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">Buyer</span>
                        ) : (
                          <span className="bg-ast-primary/10 text-ast-primary px-2.5 py-0.5 rounded-full border border-ast-primary/20">Seller</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-black font-semibold">${o.amount}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-semibold ${STATUS_BADGE[o.status] ?? ''}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-ast-gray text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sample Data Fallback */}
        {orders.length === 0 && (
          <div className="mt-10 border-t border-black/8 pt-6">
            <h4 className="font-semibold text-black mb-3 text-xs uppercase tracking-wider text-ast-gray">Platform Demo History</h4>
            <div className="overflow-x-auto opacity-75">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-black/5">
                  {dashboardData.recentOrders.map(o => (
                    <tr key={o.id}>
                      <td className="py-3 font-medium text-black">{o.gigTitle}</td>
                      <td className="py-3 text-ast-gray text-xs">Seller</td>
                      <td className="py-3 text-black font-semibold">${o.amount}</td>
                      <td className="py-3">
                        <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-semibold ${STATUS_BADGE[o.status] ?? ''}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 text-ast-gray text-xs">{o.createdAt}</td>
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