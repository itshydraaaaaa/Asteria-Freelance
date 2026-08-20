import { NextRequest, NextResponse } from 'next/server'
import { auth }                from '@/lib/auth'
import { db }                  from '@/lib/db'
import { requireOrderBuyer }   from '@/lib/authz'
import { processEscrowRelease } from '@/lib/ledger'
import { withIdempotency }      from '@/lib/idempotency'
import { sendEmail }            from '@/lib/email'
import { logger }               from '@/lib/logger'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // ── Server-side authorization: only the BUYER can approve and release funds
    const authzError = requireOrderBuyer(session, order)
    if (authzError) {
      logger.security('UNAUTHORIZED_ESCROW_RELEASE_ATTEMPT', `Unauthorized attempt to release order #${params.id}`, {
        userId: session?.user?.id,
        orderId: params.id,
        buyerId: order.buyerId,
      })
      return authzError
    }

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

      // 2. Process escrow release via ledger (88/12 split, idempotent)
      const { sellerPayout, platformFee } = await processEscrowRelease(
        order.id,
        order.sellerId,
        order.amount
      )

      // 3. Structured Audit Log
      const seller = await db.user.findUnique({ where: { id: order.sellerId } })
      logger.audit('ESCROW_RELEASED_SUCCESS', `Released ${sellerPayout} TND to seller #${order.sellerId} for order #${order.id}`, {
        userId: session!.user.id,
        orderId: order.id,
        sellerId: order.sellerId,
        amount: order.amount,
        sellerPayout,
        platformFee,
        currency: 'TND',
      })

      // ── Email notifications (non-blocking) ────────────────────────────
      if (seller?.email) {
        sendEmail({ to: seller.email, event: 'ORDER_COMPLETED', data: { orderId: order.id, netPayout: sellerPayout, amount: order.amount } })
      }

      return {
        order: updatedOrder,
        sellerPayout,
        platformFee,
        message: 'Order approved. Escrow funds released to seller.',
      }
    })

    return NextResponse.json(result)
  } catch (err: any) {
    logger.error('ORDER_COMPLETION_ERROR', `Failed to complete order #${params.id}: ${err.message}`, {
      orderId: params.id,
      error: err,
    })
    return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 })
  }
}
