import { NextRequest, NextResponse } from 'next/server'
import { auth }                    from '@/lib/auth'
import { db }                      from '@/lib/db'
import { requireOrderParty, requireOrderBuyer, requireOrderSeller } from '@/lib/authz'
import { processMilestoneRelease }  from '@/lib/ledger'
import { withIdempotency }          from '@/lib/idempotency'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // ── Server-side authorization: must be buyer or seller on this order ─────
    const authzError = requireOrderParty(session, order)
    if (authzError) return authzError

    const body = await req.json()
    const { action, milestoneId } = body as {
      action: 'FUND' | 'SUBMIT' | 'RELEASE'
      milestoneId: string
    }

    if (!action || !milestoneId) {
      return NextResponse.json({ error: 'action and milestoneId are required' }, { status: 400 })
    }

    // ── Role enforcement per action ──────────────────────────────────────────
    // Only BUYER can FUND or RELEASE; only SELLER can SUBMIT
    if ((action === 'FUND' || action === 'RELEASE') && session!.user.id !== order.buyerId) {
      return NextResponse.json(
        { error: 'Forbidden: only the buyer can fund or release milestones' },
        { status: 403 }
      )
    }
    if (action === 'SUBMIT' && session!.user.id !== order.sellerId) {
      return NextResponse.json(
        { error: 'Forbidden: only the seller can submit milestone deliverables' },
        { status: 403 }
      )
    }

    const milestone = await db.milestone.findUnique({ where: { id: milestoneId } })
    if (!milestone || milestone.orderId !== params.id) {
      return NextResponse.json({ error: 'Milestone not found on this order' }, { status: 404 })
    }

    // ── Idempotency key from request header ──────────────────────────────────
    const idempotencyKey = req.headers.get('Idempotency-Key') ?? undefined

    const result = await withIdempotency(
      idempotencyKey,
      `/api/orders/[id]/milestones:${action}`,
      session!.user.id,
      async () => {
        // Map action to next status
        const nextStatus: Record<string, 'FUNDED' | 'SUBMITTED' | 'RELEASED'> = {
          FUND: 'FUNDED', SUBMIT: 'SUBMITTED', RELEASE: 'RELEASED',
        }

        const updatedMilestone = await db.milestone.update({
          where: { id: milestoneId },
          data: { status: nextStatus[action] },
        })

        let netPayout: number | undefined
        if (action === 'RELEASE') {
          // Process ledger payout for this milestone (85% net)
          netPayout = await processMilestoneRelease(
            order.id,
            milestoneId,
            order.sellerId,
            milestone.amount
          )

          await db.auditLog.create({
            data: {
              adminId: 'system',
              adminName: 'Escrow Engine',
              action: 'MILESTONE_FUNDS_RELEASED',
              targetId: order.id,
              details: `Released $${netPayout} for milestone "${milestone.title}" on order ${order.id}`,
            }
          })
        }

        return {
          milestone: updatedMilestone,
          netPayout,
          message: `Milestone ${action === 'FUND' ? 'funded' : action === 'SUBMIT' ? 'submitted for review' : 'payment released'} successfully.`,
        }
      }
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('POST /api/orders/[id]/milestones:', err)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}
