import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth()
  
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/login?error=admin_required')
  }

  const [rawUsers, orders, gigs, verifications, logs, reports, withdrawals] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []),
    db.gig.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []),
    db.verification.findMany({ orderBy: { submittedAt: 'desc' } }).catch(() => []),
    db.auditLog.findMany().catch(() => []),
    db.report.findMany().catch(() => []),
    db.withdrawal.findMany().catch(() => []),
  ])

  const users = (rawUsers || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    walletBalance: u.walletBalance,
    verifiedStatus: u.verifiedStatus,
    rating: u.rating,
    reviewCount: u.reviewCount,
    createdAt: u.createdAt,
    image: u.image,
    bio: u.bio,
    skills: u.skills,
  }))

  return (
    <AdminClient
      initialUsers={users}
      initialOrders={orders}
      initialGigs={gigs}
      initialVerifications={verifications}
      initialLogs={logs}
      initialReports={reports}
      initialWithdrawals={withdrawals}
    />
  )
}
