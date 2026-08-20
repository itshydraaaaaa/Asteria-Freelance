import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const job = await db.job.findUnique({ where: { id: params.id } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const isJobOwner = job.clientId === userId
    const isAdmin = session?.user?.role === 'ADMIN'

    let proposals: any[] = []

    if (isJobOwner || isAdmin) {
      // Job owner & Admin can see all submitted proposals
      proposals = await db.proposal.findMany({
        where:   { jobId: params.id },
        orderBy: { createdAt: 'desc' },
      })
    } else if (userId) {
      // Freelancers can see their own proposal
      proposals = await db.proposal.findMany({
        where:   { jobId: params.id, freelancerId: userId },
      })
    } else {
      proposals = []
    }

    return NextResponse.json(proposals)
  } catch (err: any) {
    console.error('GET /api/jobs/[id]/proposals:', err)
    return NextResponse.json({ error: 'Failed to load proposals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to submit a proposal' }, { status: 401 })
    }

    const freelancerId = session.user.id

    const job = await db.job.findUnique({ where: { id: params.id } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json({ error: 'Job is not accepting new proposals' }, { status: 400 })
    }

    if (job.clientId === freelancerId) {
      return NextResponse.json({ error: 'You cannot submit a proposal to your own job' }, { status: 400 })
    }

    const body = await req.json()
    const { coverLetter, price, deliveryDays } = body

    if (!coverLetter || !price) {
      return NextResponse.json({ error: 'Missing required fields: coverLetter and price are required' }, { status: 400 })
    }

    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
    }

    const proposal = await db.proposal.create({
      data: {
        coverLetter,
        price: numericPrice,
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        jobId: params.id,
        freelancerId,
      },
    })

    // Create notification for Job Owner
    if (job.clientId) {
      await db.notification.create({
        data: {
          userId: job.clientId,
          title: 'New Proposal Received',
          message: `${session.user.name || 'A freelancer'} submitted a proposal for "${job.title}" (${numericPrice} TND).`,
          type: 'PROPOSAL_RECEIVED',
          link: `/jobs/${job.id}`,
        },
      }).catch(() => {})
    }

    try {
      revalidatePath(`/jobs/${params.id}`)
      revalidatePath('/jobs')
      revalidatePath('/dashboard')
    } catch (e) {}

    return NextResponse.json(proposal, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/jobs/[id]/proposals:', err)
    return NextResponse.json({ error: err.message || 'Failed to submit proposal' }, { status: 500 })
  }
}
