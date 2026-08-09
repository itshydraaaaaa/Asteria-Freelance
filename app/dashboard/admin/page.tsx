import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'

export default async function AdminPage() {
  const session = await auth()
  
  // Allow access for ADMIN role or demo mode
  const role = (session?.user as any)?.role ?? 'ADMIN'
  if (role !== 'ADMIN' && session?.user) {
    redirect('/dashboard')
  }

  const [users, orders, gigs, verifications, logs, reports] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
    db.gig.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
    db.verification.findMany({ orderBy: { submittedAt: 'desc' } }).catch(() => []),
    db.auditLog.findMany().catch(() => []),
    db.report.findMany().catch(() => []),
  ])

  return (
    <AdminClient
      initialUsers={users}
      initialOrders={orders}
      initialGigs={gigs}
      initialVerifications={verifications}
      initialLogs={logs}
      initialReports={reports}
    />
  )
}
