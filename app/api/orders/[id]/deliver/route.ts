import { NextRequest, NextResponse } from 'next/server'
import { auth }                  from '@/lib/auth'
import { db }                    from '@/lib/db'
import { requireOrderSeller }    from '@/lib/authz'
import { validateDeliverableUrl } from '@/lib/validateUrl'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()

    const order = await db.order.findUnique({ where: { id: params.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // ── Server-side authorization: only the SELLER can submit deliverables ───
    const authzError = requireOrderSeller(session, order)
    if (authzError) return authzError

    if (order.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot submit a deliverable for an order with status: ${order.status}` },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { deliverableUrl, notes } = body

    // ── URL Validation: only http/https allowed ──────────────────────────────
    const urlError = validateDeliverableUrl(deliverableUrl)
    if (urlError) {
      return NextResponse.json({ error: urlError }, { status: 400 })
    }

    const deliveredAt = new Date()
    const autoReleaseAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7-day auto-release timer

    const updatedOrder = await db.order.update({
      where: { id: params.id },
      data: {
        status: 'PENDING',
        deliveredAt,
        autoReleaseAt,
        deliverableUrl,
        notes,
      } as any,
    })

    return NextResponse.json({
      order: updatedOrder,
      autoReleaseAt,
      message: 'Work deliverable submitted for buyer approval. Funds will auto-release in 7 days if no dispute is opened.',
    })
  } catch (err) {
    console.error('POST /api/orders/[id]/deliver:', err)
    return NextResponse.json({ error: 'Failed to submit deliverable' }, { status: 500 })
  }
}
