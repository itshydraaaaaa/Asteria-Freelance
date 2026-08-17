import { NextRequest, NextResponse } from 'next/server'
import { auth }                    from '@/lib/auth'
import { db }                      from '@/lib/db'
import { requireOrderParty }       from '@/lib/authz'
import { processMilestoneRelease } from '@/lib/ledger'
import { withIdempotency }         from '@/lib/idempotency'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Must be buyer or seller on this order
    const authzError = requireOrderParty(session, order)
    if (authzError) return authzError

    const body = await req.json()
    const { action, milestoneId, milestones } = body as {
      action: 'FUND' | 'SUBMIT' | 'RELEASE' | 'SYNC_MILESTONES'
      milestoneId?: string
      milestones?: Array<{ id?: string; title: string; percentage: number; amount: number; status?: string }>
    }

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // ── SYNC & FIX CUSTOM MILESTONES ──────────────────────────────────────────
    if (action === 'SYNC_MILESTONES') {
      if (!Array.isArray(milestones) || milestones.length === 0) {
        return NextResponse.json({ error: 'At least one milestone is required' }, { status: 400 })
      }

      // Check sum of amounts
      const totalMilestoneSum = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
      if (Math.abs(totalMilestoneSum - order.amount) > 1) {
        return NextResponse.json(
          { error: `The sum of milestone amounts (${totalMilestoneSum} TND) must match the total order value (${order.amount} TND)` },
          { status: 400 }
        )
      }

      const savedMilestones = await Promise.all(
        milestones.map(async (m, idx) => {
          if (m.id && !m.id.startsWith('ms_')) {
            const updated = await db.milestone.update({
              where: { id: m.id },
              data: {
                title: m.title,
                amount: m.amount,
                percentage: Math.round((m.amount / order.amount) * 100),
                position: idx + 1,
              },
            })
            return updated
          } else {
            const created = await db.milestone.create({
              data: {
                orderId: order.id,
                title: m.title,
                amount: m.amount,
                percentage: Math.round((m.amount / order.amount) * 100),
                status: (m.status as any) ?? (idx === 0 ? 'FUNDED' : 'PENDING'),
                position: idx + 1,
              },
            })
            return created
          }
        })
      )

      await db.auditLog.create({
        data: {
          adminId: session!.user.id,
          adminName: session!.user.name || 'User',
          action: 'ORDER_MILESTONES_UPDATED',
          targetId: order.id,
          details: `Fixed ${milestones.length} milestones for order ${order.id} totaling ${totalMilestoneSum} TND`,
        },
      })

      return NextResponse.json({
        message: 'Milestone schedule updated and fixed successfully.',
        milestones: savedMilestones,
      })
    }

    // ── PROGRESSION ACTIONS (FUND, SUBMIT, RELEASE) ──────────────────────────
    if (!milestoneId) {
      return NextResponse.json({ error: 'milestoneId is required' }, { status: 400 })
    }

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
    const milestoneAmount = milestone?.amount ?? Math.round(order.amount * 0.3)

    const idempotencyKey = req.headers.get('Idempotency-Key') ?? undefined

    const result = await withIdempotency(
      idempotencyKey,
      `/api/orders/[id]/milestones:${action}`,
      session!.user.id,
      async () => {
        const nextStatus: Record<string, 'FUNDED' | 'SUBMITTED' | 'RELEASED'> = {
          FUND: 'FUNDED', SUBMIT: 'SUBMITTED', RELEASE: 'RELEASED',
        }

        let updatedMilestone: any = null
        try {
          updatedMilestone = await db.milestone.update({
            where: { id: milestoneId },
            data: { status: nextStatus[action] },
          })
        } catch {
          updatedMilestone = { id: milestoneId, status: nextStatus[action], amount: milestoneAmount }
        }

        let netPayout: number | undefined
        if (action === 'RELEASE') {
          // Process ledger payout for this milestone (88% net)
          netPayout = await processMilestoneRelease(
            order.id,
            milestoneId,
            order.sellerId,
            milestoneAmount
          )

          await db.auditLog.create({
            data: {
              adminId: 'system',
              adminName: 'Escrow Engine',
              action: 'MILESTONE_FUNDS_RELEASED',
              targetId: order.id,
              details: `Released ${netPayout} TND for milestone "${milestone?.title ?? milestoneId}" on order ${order.id}`,
            },
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
  } catch (err: any) {
    console.error('POST /api/orders/[id]/milestones:', err)
    return NextResponse.json({ error: err.message || 'Failed to update milestone' }, { status: 500 })
  }
}
