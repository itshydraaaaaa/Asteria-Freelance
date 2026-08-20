import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getLedgerHistory } from '@/lib/ledger'
import { requireAuth } from '@/lib/authz'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const authErr = requireAuth(session)
    if (authErr) return authErr

    const userId = session!.user.id

    // Fetch user profile, gigs, jobs, orders, proposals, verifications, and ledger history
    const user = await db.user.findUnique({ where: { id: userId } })
    const gigs = await db.gig.findMany({ where: { freelancerId: userId } })
    const jobs = await db.job.findMany({ where: { clientId: userId } })
    const proposals = await db.proposal.findMany({ where: { freelancerId: userId } })
    const buyOrders = await db.order.findMany({ where: { buyerId: userId } })
    const sellOrders = await db.order.findMany({ where: { sellerId: userId } })
    const verification = await db.verification.findUnique({ where: { userId } })
    const transactions = await getLedgerHistory(userId, 200)

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        bio: user?.bio,
        skills: user?.skills,
        walletBalance: user?.walletBalance,
        verifiedStatus: user?.verifiedStatus,
        createdAt: user?.createdAt,
      },
      gigs,
      jobs,
      proposals,
      orders: [...buyOrders, ...sellOrders],
      verification: verification ? {
        documentType: verification.documentType,
        country: verification.country,
        status: verification.status,
        submittedAt: verification.submittedAt,
      } : null,
      transactions,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="asteria_data_export_${userId}.json"`,
      },
    })
  } catch (err: any) {
    console.error('GET /api/user/data-export error:', err)
    return NextResponse.json({ error: 'Failed to export user data' }, { status: 500 })
  }
}
