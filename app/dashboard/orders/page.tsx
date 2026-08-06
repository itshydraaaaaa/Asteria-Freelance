import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { dashboardData } from '@/lib/data/dashboard'

export default async function OrdersPage() {
  const supabase = createClient()
  
  // 1. Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch orders securely from Supabase where the user is either the buyer or seller
  let orders: any[] = []
  
  try {
    const { data } = await supabase
      .from('Order')
      .select('*, gig:Gig(title, thumbnail), buyer:User!buyerId(name, image), seller:User!sellerId(name, image)')
      .or(`buyerId.eq.${user.id},sellerId.eq.${user.id}`)
      .order('createdAt', { ascending: false })
      
    if (data) {
      // Clean up the joined data arrays that Supabase returns into single objects
      orders = data.map((o: any) => ({
        ...o,
        gig: o.gig ? (Array.isArray(o.gig) ? o.gig[0] : o.gig) : null,
        buyer: o.buyer ? (Array.isArray(o.buyer) ? o.buyer[0] : o.buyer) : null,
        seller: o.seller ? (Array.isArray(o.seller) ? o.seller[0] : o.seller) : null,
      }))
    }
  } catch (error) {
    console.error("Failed to fetch orders:", error)
  }

  const STATUS_BADGE: Record<string, string> = {
    PENDING:   'bg-black/8 text-black border border-black/15',
    ACTIVE:    'bg-ast-primary text-white',
    COMPLETED: 'bg-ast-muted text-ast-primary border border-ast-light/40',
    CANCELLED: 'bg-black text-white',
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-3xl text-black mb-8">My Orders</h1>

      <div className="bg-white rounded-2xl border border-black/8 p-6">
        {orders.length === 0 ? (
          <p className="text-ast-gray text-sm text-center py-8">
            You don't have any orders yet. <a href="/explore" className="text-ast-primary hover:underline">Browse gigs</a> to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Gig</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.map(o => {
                  const isBuyer = o.buyerId === user.id
                  return (
                    <tr key={o.id}>
                      <td className="py-4 font-medium text-black">
                        <div className="flex items-center gap-3">
                          {o.gig?.thumbnail && (
                            <img src={o.gig.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
                          )}
                          <span>{o.gig?.title ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-4 text-ast-gray">
                        {isBuyer ? 'Buyer' : 'Seller'}
                      </td>
                      <td className="py-4 text-ast-gray font-medium">${o.amount}</td>
                      <td className="py-4">
                        <span className={`inline-block text-xs rounded-full px-2.5 py-1 font-medium ${STATUS_BADGE[o.status] ?? ''}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-4 text-ast-gray">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Fallback to sample data if no real orders exist, just to keep the UI looking good! */}
        {orders.length === 0 && (
          <div className="mt-12 border-t border-black/8 pt-6 opacity-60">
            <h4 className="font-semibold text-black mb-3 text-sm">Sample Data</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-black/5">
                  {dashboardData.recentOrders.map(o => (
                    <tr key={o.id}>
                      <td className="py-3 font-medium text-black">{o.gigTitle}</td>
                      <td className="py-3 text-ast-gray">Seller</td>
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