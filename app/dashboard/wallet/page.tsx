import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, DollarSign } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  ACTIVE:    'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
}

export default async function WalletPage() {
  const session = await auth()
  const userId  = session?.user?.id ?? ''

  let dbUser: any = null
  let orders: any[] = []

  try {
    dbUser = await db.user.findUnique({ where: { id: userId }, select: { walletBalance: true } })
    orders = await db.order.findMany({
      where:   { sellerId: userId },
      include: { gig: { select: { title: true } }, buyer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  } catch {}

  const balance         = dbUser?.walletBalance ?? 0
  const totalEarned     = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.amount, 0)
  const pendingEarnings = orders.filter(o => o.status === 'ACTIVE').reduce((s, o) => s + o.amount, 0)
  const totalOrders     = orders.length

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-ast-primary flex items-center justify-center">
          <Wallet size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">Wallet</h1>
          <p className="text-ast-gray text-sm">Your earnings and transaction history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Available Balance',  value: `$${balance.toLocaleString()}`,         Icon: DollarSign,   color: 'text-ast-primary',  bg: 'bg-ast-primary/10' },
          { label: 'Total Earned',       value: `$${totalEarned.toLocaleString()}`,      Icon: ArrowDownLeft, color: 'text-green-600',   bg: 'bg-green-50' },
          { label: 'Pending Clearance',  value: `$${pendingEarnings.toLocaleString()}`,  Icon: Clock,        color: 'text-yellow-600',   bg: 'bg-yellow-50' },
          { label: 'Total Orders',       value: String(totalOrders),                     Icon: ArrowUpRight, color: 'text-sky-600',      bg: 'bg-sky-50' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-5 border-l-[3px] border-l-ast-primary">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-ast-gray text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className="font-heading font-bold text-2xl text-black">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
            <h2 className="font-semibold text-black">Transaction History</h2>
            <span className="text-xs text-ast-gray">{orders.length} transactions</span>
          </div>
          {orders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-ast-gray text-sm">No transactions yet.</p>
              <p className="text-ast-gray text-xs mt-1">Complete orders to start earning.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/8 text-left text-xs uppercase tracking-wider text-ast-gray">
                    <th className="px-5 py-3 font-medium">Gig</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-black truncate max-w-[160px]">{o.gig?.title ?? '—'}</td>
                      <td className="px-5 py-3 text-ast-gray text-xs">{o.buyer?.name ?? '—'}</td>
                      <td className="px-5 py-3 font-semibold text-black">${o.amount}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_BADGE[o.status] ?? ''}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ast-gray text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-black/8 p-5">
            <h3 className="font-semibold text-black mb-4">Withdraw Earnings</h3>
            <div className="bg-ast-surface rounded-xl p-4 mb-4">
              <p className="text-xs text-ast-gray mb-1">Available to withdraw</p>
              <p className="font-heading font-bold text-2xl text-ast-primary">${balance.toLocaleString()}</p>
            </div>
            <div className="space-y-2 mb-4">
              {['Stripe (International)', 'PayPal', 'Wise', 'Flouci (Tunisia)', 'Bank Transfer'].map(method => (
                <div key={method} className="flex items-center gap-2 text-sm text-ast-gray">
                  <div className="w-1.5 h-1.5 rounded-full bg-ast-primary" />
                  {method}
                </div>
              ))}
            </div>
            <button className="w-full bg-ast-primary text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-ast-dark transition-colors">
              Request Withdrawal
            </button>
            <p className="text-xs text-ast-gray text-center mt-2">Minimum withdrawal: $20</p>
          </div>

          <div className="bg-ast-dark rounded-2xl p-5 text-white">
            <h3 className="font-semibold mb-2">Platform Fee</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Asteria charges a 15% service fee on completed orders. Upgrade to Premium to reduce this to 10%.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
