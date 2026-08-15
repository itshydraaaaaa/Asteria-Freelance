import { NextRequest, NextResponse } from 'next/server'
import { auth }                from '@/lib/auth'
import { db }                  from '@/lib/db'
import { requireOrderBuyer }   from '@/lib/authz'
import { processEscrowRelease } from '@/lib/ledger'
import { withIdempotency }      from '@/lib/idempotency'
import { sendEmail }            from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // ── Server-side authorization: only the BUYER can approve and release funds
    const authzError = requireOrderBuyer(session, order)
    if (authzError) return authzError

    if (order.status !== 'PENDING' && order.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot complete an order with status: ${order.status}` },
        { status: 400 }
      )
    }

    // ── Idempotency key from request header ──────────────────────────────────
    const idempotencyKey = req.headers.get('Idempotency-Key') ?? undefined

    const result = await withIdempotency(idempotencyKey, '/api/orders/[id]/complete', session!.user.id, async () => {
      // 1. Update order to COMPLETED
      const updatedOrder = await db.order.update({
        where: { id: params.id },
        data: { status: 'COMPLETED' },
      })

      // 2. Process escrow release via ledger (85/15 split, idempotent)
      const { sellerPayout, platformFee } = await processEscrowRelease(
        order.id,
        order.sellerId,
        order.amount
      )

      // 3. Audit log
      const seller = await db.user.findUnique({ where: { id: order.sellerId } })
      await db.auditLog.create({
        data: {
          adminId: 'system',
          adminName: 'Escrow Engine',
          action: 'ORDER_FUNDS_RELEASED',
          targetId: order.id,
          details: `Released $${sellerPayout} to ${seller?.name ?? order.sellerId} for order ${order.id}. Platform fee: $${platformFee}`,
        }
      })

      // ── Email notifications (non-blocking) ────────────────────────────
      if (seller?.email) {
        sendEmail({ to: seller.email, event: 'ORDER_COMPLETED', data: { orderId: order.id, netPayout: sellerPayout, amount: order.amount } })
      }

      return {
        order: updatedOrder,
        sellerPayout,
        platformFee,
        message: 'Order approved. Funds released to seller.',
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('POST /api/orders/[id]/complete:', err)
    return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 })
  }
}
