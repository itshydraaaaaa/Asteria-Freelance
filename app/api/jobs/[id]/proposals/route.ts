import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/authz'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const authErr = requireAuth(session)
    if (authErr) return authErr

    const userId = session!.user.id
    const userRole = session!.user.role

    const job = await db.job.findUnique({ where: { id: params.id } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const isJobOwner = job.clientId === userId
    const isAdmin = userRole === 'ADMIN'

    let proposals: any[] = []

    if (isJobOwner || isAdmin) {
      // Job owner & Admin can see all submitted proposals
      proposals = await db.proposal.findMany({
        where:   { jobId: params.id },
        include: { freelancer: { select: { name: true, image: true, bio: true, skills: true } } },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      // Freelancers can ONLY see their own proposal to prevent proposal snooping & bid copying
      proposals = await db.proposal.findMany({
        where:   { jobId: params.id, freelancerId: userId },
        include: { freelancer: { select: { name: true, image: true, bio: true, skills: true } } },
      })
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
    const roleErr = requireRole(session, 'FREELANCER')
    if (roleErr) return roleErr

    const freelancerId = session!.user.id

    const job = await db.job.findUnique({ where: { id: params.id } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json({ error: 'Job is not accepting new proposals' }, { status: 400 })
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

    const existing = await db.proposal.findFirst({
      where: { jobId: params.id, freelancerId },
    })
    if (existing) {
      return NextResponse.json({ error: 'You already submitted a proposal for this job' }, { status: 409 })
    }

    const proposal = await db.proposal.create({
      data: {
        coverLetter,
        price:       numericPrice,
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        jobId:       params.id,
        freelancerId,
      },
    })

    // Create notification for Job Owner
    if (job.clientId) {
      await db.notification.create({
        data: {
          userId: job.clientId,
          title: 'New Proposal Received',
          message: `${session!.user.name || 'A freelancer'} submitted a proposal for "${job.title}" (${numericPrice} TND).`,
          type: 'PROPOSAL_RECEIVED',
          link: `/dashboard/jobs/${job.id}`,
        },
      }).catch(() => {})
    }

    return NextResponse.json(proposal, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/jobs/[id]/proposals:', err)
    return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 })
  }
}
