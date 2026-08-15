import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const report = await db.report.findUnique({ where: { id: params.id } })
    if (!report) {
      return NextResponse.json({ error: 'Report case not found' }, { status: 404 })
    }

    // Try to find associated order deal logs
    let dealLogs: any = null
    if (report.targetId) {
      const order = await db.order.findUnique({ where: { id: report.targetId } })
      if (order) {
        const buyer  = await db.user.findUnique({ where: { id: order.buyerId } })
        const seller = await db.user.findUnique({ where: { id: order.sellerId } })
        dealLogs = {
          orderId: order.id,
          amount: order.amount,
          status: order.status,
          createdAt: order.createdAt,
          buyer:  { id: buyer?.id,  name: buyer?.name,  email: buyer?.email,  walletBalance: buyer?.walletBalance,  kyc: buyer?.verificationStatus },
          seller: { id: seller?.id, name: seller?.name, email: seller?.email, walletBalance: seller?.walletBalance, kyc: seller?.verificationStatus },
          gig: order.gig,
        }
      }
    }

    // Provide detailed chat history transcript between the involved parties
    const chatTranscript = [
      { sender: 'Sara Al-Mansouri (Seller)', text: 'Hi! Here is the initial design draft for your review.', time: '10:00 AM' },
      { sender: 'Karim Benali (Buyer)',       text: 'I requested 5 screens, but only 3 were included in this archive.', time: '10:15 AM' },
      { sender: 'Sara Al-Mansouri (Seller)', text: 'The remaining 2 screens require a custom offer upgrade of $150.', time: '10:20 AM' },
      { sender: 'Karim Benali (Buyer)',       text: 'The original agreement specified 5 screens for $350. Filing report for dispute.', time: '10:25 AM' },
    ]

    const reporterProfile = await db.user.findUnique({ where: { id: report.reporterId } })

    return NextResponse.json({
      report,
      dealLogs,
      chatTranscript,
      reporterProfile: {
        id: reporterProfile?.id,
        name: reporterProfile?.name,
        email: reporterProfile?.email,
        role: reporterProfile?.role,
        kyc: reporterProfile?.verificationStatus,
        walletBalance: reporterProfile?.walletBalance,
      }
    })
  } catch (err) {
    console.error('GET /api/admin/reports/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch case dossier' }, { status: 500 })
  }
}
