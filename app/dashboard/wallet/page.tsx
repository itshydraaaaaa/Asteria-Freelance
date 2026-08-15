import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { getTransactionHistory } from '@/lib/ledger'
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, DollarSign, Shield, CheckCircle2 } from 'lucide-react'
import { WalletActionClient } from '@/components/wallet/WalletActionClient'

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  ACTIVE:    'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
}

const TX_TYPE_BADGE: Record<string, { label: string; style: string }> = {
  DEPOSIT:      { label: 'Deposit', style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  FUND_ESCROW:  { label: 'Escrow Fund', style: 'bg-sky-50 text-sky-700 border border-sky-200' },
  RELEASE:      { label: 'Payout Release', style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  REFUND:       { label: 'Refund', style: 'bg-amber-50 text-amber-700 border border-amber-200' },
  PLATFORM_FEE: { label: 'Commission', style: 'bg-purple-50 text-purple-700 border border-purple-200' },
  WITHDRAWAL:   { label: 'Withdrawal', style: 'bg-gray-50 text-gray-700 border border-gray-200' },
}

export default async function WalletPage() {
  const session = await auth()
  const userId  = session?.user?.id ?? ''
  const role    = (session?.user as any)?.role ?? 'CLIENT'

  let dbUser: any = null
  let orders: any[] = []
  let ledgerTx: any[] = []

  try {
    dbUser = await db.user.findUnique({ where: { id: userId }, select: { walletBalance: true } })
    orders = await db.order.findMany({
      where: role === 'FREELANCER' ? { sellerId: userId } : { buyerId: userId },
      include: { gig: { select: { title: true } }, buyer: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    ledgerTx = await getTransactionHistory(userId).catch(() => [])
  } catch {}

  const balance         = Number(dbUser?.walletBalance ?? (role === 'FREELANCER' ? 1450 : 3200))
  const totalEarned     = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + (role === 'FREELANCER' ? o.amount * 0.85 : o.amount), 0)
  const pendingEarnings = orders.filter(o => o.status === 'ACTIVE' || o.status === 'PENDING').reduce((s, o) => s + (role === 'FREELANCER' ? o.amount * 0.85 : o.amount), 0)
  const totalOrders     = orders.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-ast-primary flex items-center justify-center shadow-sm">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl text-black">My Wallet</h1>
            <p className="text-ast-gray text-xs">Escrow balances, payouts, and ledger transactions</p>
          </div>
        </div>

        {/* Top-Up & Withdraw Client Action */}
        <WalletActionClient balance={balance} userId={userId} userRole={role} />
      </div>

      {/* KPI Cards in TND */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Available Balance',
            value: `${balance.toLocaleString()} TND`,
            Icon: DollarSign,
            color: 'text-ast-primary',
            bg: 'bg-ast-primary/10',
          },
          {
            label: role === 'FREELANCER' ? 'Total Payouts (85%)' : 'Total Spent',
            value: `${totalEarned.toLocaleString()} TND`,
            Icon: ArrowDownLeft,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Escrow Locked',
            value: `${pendingEarnings.toLocaleString()} TND`,
            Icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Active Contracts',
            value: String(totalOrders),
            Icon: ArrowUpRight,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
          },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-5 border-l-[3px] border-l-ast-primary shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-ast-gray text-xs uppercase tracking-wider mb-1 font-semibold">{label}</p>
            <p className="font-heading font-bold text-2xl text-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Escrow Transactions */}
          <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
              <h2 className="font-semibold text-black text-sm">Order & Escrow Activity</h2>
              <span className="text-xs text-ast-gray">{orders.length} orders</span>
            </div>
            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ast-gray text-sm">No orders yet.</p>
                <p className="text-ast-gray text-xs mt-1">Start contracts on Asteria to see your transaction history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/8 text-left text-xs uppercase tracking-wider text-ast-gray bg-ast-surface/50">
                      <th className="px-5 py-3 font-semibold">Service</th>
                      <th className="px-5 py-3 font-semibold">{role === 'FREELANCER' ? 'Client' : 'Freelancer'}</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-ast-surface/40 transition-colors">
                        <td className="px-5 py-3 font-medium text-black truncate max-w-[180px]">{o.gig?.title ?? `Order #${o.id.slice(0, 8)}`}</td>
                        <td className="px-5 py-3 text-ast-gray text-xs font-medium">{role === 'FREELANCER' ? (o.buyer?.name ?? 'Client') : (o.seller?.name ?? 'Freelancer')}</td>
                        <td className="px-5 py-3 font-bold text-black">{o.amount} TND</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block text-[10px] font-bold rounded-full px-2 py-0.5 ${STATUS_BADGE[o.status] ?? ''}`}>
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
        </div>

        {/* Side Panels */}
        <div className="space-y-5">
          {/* Quick Info */}
          <div className="bg-white rounded-2xl border border-black/8 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-black text-sm flex items-center gap-2">
              <Shield size={16} className="text-ast-primary" /> Asteria Escrow Guarantee
            </h3>
            <div className="bg-ast-surface rounded-xl p-3.5 space-y-2 border border-black/5">
              <p className="text-xs text-ast-gray leading-relaxed">
                When an order is created, the buyer's funds are held in secure escrow. Payments are only released to the freelancer once deliverables or milestones are approved.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} /> 100% Protected Payment Rails
              </div>
            </div>

            <div className="pt-2 border-t border-black/8">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider mb-2">Supported Payouts in Tunisia</h4>
              <div className="space-y-1.5 text-xs text-ast-gray">
                <p>• <strong>Flouci</strong> (Instant wallet transfer)</p>
                <p>• <strong>Tunisian Banks</strong> (RIB Transfer in TND)</p>
                <p>• <strong>Stripe & Wise</strong> (International payouts)</p>
              </div>
            </div>
          </div>

          <div className="bg-ast-dark rounded-2xl p-5 text-white shadow-sm space-y-2">
            <h3 className="font-semibold text-sm">Platform Commission</h3>
            <p className="text-white/70 text-xs leading-relaxed">
              Asteria retains a transparent 15% platform fee on completed orders. The freelancer receives 85% net payout directly to their available balance upon approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
