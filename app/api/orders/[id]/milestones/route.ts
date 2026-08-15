import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { action, milestoneId } = body // action: 'FUND' | 'SUBMIT' | 'RELEASE'

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    let milestones = order.milestones ?? [
      { id: 'ms_1', title: 'Milestone 1: Wireframes & System Architecture', percentage: 30, amount: order.amount * 0.3, status: 'FUNDED' },
      { id: 'ms_2', title: 'Milestone 2: Frontend Implementation & Integration', percentage: 40, amount: order.amount * 0.4, status: 'PENDING' },
      { id: 'ms_3', title: 'Milestone 3: Testing, Quality Assurance & Launch', percentage: 30, amount: order.amount * 0.3, status: 'PENDING' },
    ]

    const targetIdx = milestones.findIndex((m: any) => m.id === milestoneId)
    if (targetIdx !== -1) {
      if (action === 'FUND') {
        milestones[targetIdx].status = 'FUNDED'
      } else if (action === 'SUBMIT') {
        milestones[targetIdx].status = 'SUBMITTED'
      } else if (action === 'RELEASE') {
        milestones[targetIdx].status = 'RELEASED'
        // Credit seller wallet with net payout for this milestone
        const seller = await db.user.findUnique({ where: { id: order.sellerId } })
        if (seller) {
          const netMilestonePayout = milestones[targetIdx].amount * 0.85
          await db.user.update({
            where: { id: order.sellerId },
            data: { walletBalance: seller.walletBalance + netMilestonePayout }
          })
        }
      }
    }

    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: { milestones }
    })

    return NextResponse.json({ order: updatedOrder, message: `Milestone status updated to ${action}!` })
  } catch (err) {
    console.error('POST /api/orders/[id]/milestones error:', err)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}
