import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status to COMPLETED
    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: { status: 'COMPLETED' }
    })

    // Credit seller's wallet balance (net after platform fee)
    const seller = await db.user.findUnique({ where: { id: order.sellerId } })
    if (seller) {
      const netPayout = order.amount * 0.85 // 85% payout after 15% platform fee
      await db.user.update({
        where: { id: order.sellerId },
        data: { walletBalance: seller.walletBalance + netPayout }
      })

      // Log in audit trail
      await db.auditLog.create({
        data: {
          adminId: 'system',
          adminName: 'Escrow Engine',
          action: 'ORDER_FUNDS_RELEASED',
          details: `Released $${netPayout} to seller ${seller.name} for Order #${order.id}`
        }
      })
    }

    return NextResponse.json({ order: updatedOrder, message: 'Order approved and funds released!' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 })
  }
}
