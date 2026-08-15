import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { reason, description } = body

    if (!reason || !description) {
      return NextResponse.json({ error: 'Reason and description are required' }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Create report/dispute record
    const disputeReport = await db.report.create({
      data: {
        reporterId: userId,
        reporterName: session.user.name || 'User',
        targetType: 'JOB',
        targetId: params.id,
        targetTitle: `Order Dispute #${params.id}`,
        reason: `ORDER_DISPUTE: ${reason}`,
        description,
      }
    })

    // Update order status to CANCELLED / DISPUTED
    await db.order.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    })

    // Audit log
    await db.auditLog.create({
      data: {
        adminId: userId,
        adminName: session.user.name || 'User',
        action: 'DISPUTE_OPENED',
        details: `Dispute opened for Order #${params.id}: ${reason}`
      }
    })

    return NextResponse.json({ dispute: disputeReport, message: 'Dispute opened and escalated to Admin Panel' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to open dispute' }, { status: 500 })
  }
}
