import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { getTransactionHistory } from '@/lib/ledger'
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, DollarSign, Shield, CheckCircle2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { WalletActionClient } from '@/components/wallet/WalletActionClient'
import { WalletOverviewClient } from '@/components/dashboard/WalletOverviewClient'

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
  if (!session?.user) {
    redirect('/login')
  }
  const userId  = session.user.id
  const role    = (session.user as any)?.role ?? 'CLIENT'

  let dbUser: any = null
  let orders: any[] = []

  try {
    dbUser = await db.user.findUnique({ where: { id: userId }, select: { walletBalance: true } })
    orders = await db.order.findMany({
      where: role === 'FREELANCER' ? { sellerId: userId } : { buyerId: userId },
      include: { gig: { select: { title: true } }, buyer: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  } catch {}

  const balance         = Number(dbUser?.walletBalance ?? (role === 'CLIENT' ? 5000 : 0))
  const totalEarned     = orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + (role === 'FREELANCER' ? o.amount * 0.88 : o.amount), 0)
  const pendingEarnings = orders.filter(o => o.status === 'ACTIVE' || o.status === 'PENDING').reduce((s, o) => s + (role === 'FREELANCER' ? o.amount * 0.88 : o.amount), 0)

  return (
    <WalletOverviewClient
      balance={balance}
      userId={userId}
      role={role}
      totalEarned={totalEarned}
      pendingEarnings={pendingEarnings}
      orders={orders}
    />
  )
}
