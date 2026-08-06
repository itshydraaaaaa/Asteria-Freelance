import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const proposals = await db.proposal.findMany({
      where:   { jobId: params.id },
      include: { freelancer: { select: { name: true, image: true, bio: true, skills: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(proposals)
  } catch (err) {
    console.error('GET /api/jobs/[id]/proposals:', err)
    return NextResponse.json({ error: 'Failed to load proposals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { coverLetter, price, deliveryDays } = body

    if (!coverLetter || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existing = await db.proposal.findFirst({
      where: { jobId: params.id, freelancerId: session.user.id! },
    })
    if (existing) {
      return NextResponse.json({ error: 'You already submitted a proposal for this job' }, { status: 409 })
    }

    const proposal = await db.proposal.create({
      data: {
        coverLetter,
        price:       parseFloat(price),
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        jobId:       params.id,
        freelancerId: session.user.id!,
      },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (err) {
    console.error('POST /api/jobs/[id]/proposals:', err)
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 })
  }
}
