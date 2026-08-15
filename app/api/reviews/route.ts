import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, freelancerId, gigId, rating, comment } = body

    if (!orderId || !freelancerId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 })
    }

    const review = await db.review.create({
      data: {
        orderId,
        freelancerId,
        gigId,
        reviewerId: userId,
        reviewerName: session.user.name || 'Client Reviewer',
        reviewerImage: session.user.image || null,
        rating: parseInt(rating, 10),
        comment,
      }
    })

    // Recalculate freelancer average rating and review count
    const freelancer = await db.user.findUnique({ where: { id: freelancerId } })
    if (freelancer) {
      const currentCount = freelancer.reviewCount ?? 0
      const currentRating = freelancer.rating ?? 5.0
      const newCount = currentCount + 1
      const newRating = Number(((currentRating * currentCount + parseInt(rating, 10)) / newCount).toFixed(1))

      await db.user.update({
        where: { id: freelancerId },
        data: {
          rating: newRating,
          reviewCount: newCount,
        }
      })
    }

    return NextResponse.json({ review, message: 'Review submitted successfully!' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/reviews error:', err)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const freelancerId = searchParams.get('freelancerId')
    const gigId = searchParams.get('gigId')

    let reviews = await db.review.findMany()
    if (freelancerId) reviews = reviews.filter((r: any) => r.freelancerId === freelancerId)
    if (gigId) reviews = reviews.filter((r: any) => r.gigId === gigId)

    return NextResponse.json({ reviews })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}
