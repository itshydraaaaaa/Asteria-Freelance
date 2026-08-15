import { NextRequest, NextResponse } from 'next/server'
import { auth }             from '@/lib/auth'
import { db }               from '@/lib/db'
import { requireAuth }      from '@/lib/authz'
import { rateLimit }        from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    // ── Server-side authorization ────────────────────────────────────────────
    const authzError = requireAuth(session)
    if (authzError) return authzError

    // ── Rate limiting ────────────────────────────────────────────────────────
    const rateLimited = await rateLimit(session!.user.id, '/api/reviews')
    if (rateLimited) return rateLimited

    const body = await req.json()
    const { orderId, freelancerId, gigId, rating, comment } = body

    if (!orderId || !freelancerId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields: orderId, freelancerId, rating, comment' }, { status: 400 })
    }

    const numericRating = parseInt(rating, 10)
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
    }

    // ── Verify caller is the buyer on this order ─────────────────────────────
    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (session!.user.id !== order.buyerId) {
      return NextResponse.json(
        { error: 'Forbidden: only the buyer on this order can submit a review' },
        { status: 403 }
      )
    }
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Reviews can only be submitted for completed orders' },
        { status: 400 }
      )
    }

    // ── Create review (UNIQUE(order_id) constraint will reject duplicates) ───
    const review = await db.review.create({
      data: {
        orderId,
        freelancerId,
        gigId,
        reviewerId:    session!.user.id,
        reviewerName:  session!.user.name || 'Client',
        reviewerImage: session!.user.image || null,
        rating:        numericRating,
        comment,
      }
    })

    // ── Recalculate freelancer's weighted average rating ─────────────────────
    const freelancer = await db.user.findUnique({ where: { id: freelancerId } })
    if (freelancer) {
      const currentCount  = freelancer.reviewCount ?? 0
      const currentRating = freelancer.rating ?? 5.0
      const newCount      = currentCount + 1
      const newRating     = Number(((currentRating * currentCount + numericRating) / newCount).toFixed(1))

      await db.user.update({
        where: { id: freelancerId },
        data: { rating: newRating, reviewCount: newCount }
      })
    }

    return NextResponse.json({ review, message: 'Review submitted successfully!' }, { status: 201 })
  } catch (err: any) {
    // Postgres UNIQUE violation = duplicate review on same order
    if (err?.message?.includes('one_review_per_order') || err?.code === '23505') {
      return NextResponse.json(
        { error: 'A review has already been submitted for this order' },
        { status: 409 }
      )
    }
    console.error('POST /api/reviews:', err)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const freelancerId = searchParams.get('freelancerId')
    const gigId        = searchParams.get('gigId')

    const reviews = await db.review.findMany({
      where: {
        ...(freelancerId ? { freelancerId } : {}),
        ...(gigId        ? { gigId }        : {}),
      }
    })

    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('GET /api/reviews:', err)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}
