import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react'

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
    ACTIVE:    'bg-sky-50 text-sky-700 border border-sky-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">My Orders</h1>
          <p className="text-ast-gray text-xs mt-1">Track active orders, workspace deliverables, and direct client/seller chats</p>
        </div>
        <Link
          href="/explore"
          className="px-5 py-2.5 bg-ast-primary text-white text-xs font-semibold rounded-2xl hover:bg-ast-dark transition-colors shadow-sm self-start sm:self-auto"
        >
          Explore Gigs
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-black/8 p-6 shadow-sm">
        {orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ShieldCheck size={40} className="text-ast-primary/40 mx-auto" />
            <h3 className="font-bold text-sm text-black">No Active Orders Yet</h3>
            <p className="text-ast-gray text-xs max-w-sm mx-auto">
              Place an order on any gig or negotiate a custom offer in messages to see your active escrow workspace here.
            </p>
            <Link href="/explore" className="inline-block bg-ast-primary text-white text-xs font-semibold px-6 py-2.5 rounded-full hover:bg-ast-dark transition-colors mt-2">
              Browse Marketplace Gigs
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-4 py-3 font-medium">Gig Service</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Escrow Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => {
                  const isBuyer = o.buyerId === userId
                  const partnerId = isBuyer ? o.sellerId : o.buyerId

                  return (
                    <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                      <td className="px-4 py-4 font-medium text-black">
                        <Link href={`/dashboard/orders/${o.id}`} className="hover:text-ast-primary transition-colors flex items-center gap-2">
                          <span className="truncate max-w-xs font-semibold">{o.gig?.title ?? `Order #${o.id.slice(0, 8)}`}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-ast-gray text-xs font-medium">
                        {isBuyer ? (
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold">Client (Buyer)</span>
                        ) : (
                          <span className="bg-ast-primary/10 text-ast-primary px-2.5 py-0.5 rounded-full border border-ast-primary/20 font-semibold">Freelancer</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-black font-bold">{o.amount} TND</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block text-xs rounded-full px-2.5 py-0.5 font-bold ${STATUS_BADGE[o.status] ?? 'bg-ast-surface text-black'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-ast-gray text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/messages?user=${partnerId}`}
                            className="px-3 py-1.5 rounded-xl border border-black/15 text-xs font-semibold text-ast-dark hover:bg-ast-surface transition-colors flex items-center gap-1"
                            title={isBuyer ? 'Chat with Seller' : 'Chat with Client'}
                          >
                            <MessageSquare size={13} className="text-ast-primary" />
                            <span>{isBuyer ? 'Contact Seller' : 'Contact Client'}</span>
                          </Link>

                          <Link
                            href={`/dashboard/orders/${o.id}`}
                            className="px-3.5 py-1.5 rounded-xl bg-ast-primary text-white text-xs font-semibold hover:bg-ast-dark transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <span>Workspace</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}