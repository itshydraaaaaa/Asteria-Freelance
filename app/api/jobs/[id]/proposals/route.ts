import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { debitWallet, getBalance } from '@/lib/ledger'
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

    const user = await db.user.findUnique({ where: { id: freelancerId } })
    if (user && user.verifiedStatus !== 'APPROVED' && user.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'Identity verification required. You can watch and explore until your KYC is approved.'
      }, { status: 403 })
    }

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 })
    }

    const clientId = session.user.id
    const job = await db.job.findUnique({ where: { id: params.id } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const isJobOwner = job.clientId === clientId
    const isAdmin = (session.user as any).role === 'ADMIN'

    if (!isJobOwner && !isAdmin) {
      return NextResponse.json({ error: 'Only the job poster can manage proposals' }, { status: 403 })
    }

    const body = await req.json()
    const { proposalId, action } = body

    if (!proposalId || !['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Valid proposalId and action (ACCEPT | REJECT) are required' }, { status: 400 })
    }

    const proposal = await db.proposal.findUnique({ where: { id: proposalId } })
    if (!proposal || proposal.jobId !== params.id) {
      return NextResponse.json({ error: 'Proposal not found for this job' }, { status: 404 })
    }

    if (action === 'REJECT') {
      await db.proposal.update({
        where: { id: proposalId },
        data: { status: 'REJECTED' },
      })

      // Send notification to freelancer
      await db.notification.create({
        data: {
          userId: proposal.freelancerId,
          title: 'Proposal Update',
          message: `Your proposal for "${job.title}" was not selected by the client.`,
          type: 'PROPOSAL_REJECTED',
          link: `/jobs/${job.id}`,
        },
      }).catch(() => {})

      try {
        revalidatePath(`/jobs/${params.id}`)
        revalidatePath('/jobs')
        revalidatePath('/dashboard')
      } catch (e) {}

      return NextResponse.json({ success: true, message: 'Proposal declined' })
    }

    // ── ACCEPT PROPOSAL & CONVERT TO ACTIVE JOB ORDER ───────────────────────
    if (job.status !== 'OPEN') {
      return NextResponse.json({ error: 'This job has already been awarded or closed' }, { status: 400 })
    }

    const proposalAmount = Number(proposal.price)

    // 1. Verify client wallet balance
    let clientBalance = 0
    try {
      clientBalance = await getBalance(clientId)
    } catch {
      const u = await db.user.findUnique({ where: { id: clientId } })
      clientBalance = u?.walletBalance ?? 0
    }

    if (clientBalance < proposalAmount) {
      return NextResponse.json({
        error: `Insufficient wallet balance. You have ${clientBalance.toFixed(2)} TND, but this proposal requires ${proposalAmount.toFixed(2)} TND. Please top up your wallet first.`,
        requiredAmount: proposalAmount,
        currentBalance: clientBalance,
      }, { status: 402 })
    }

    // 2. Create the active Order in database
    const order = await db.order.create({
      data: {
        gigId: `job-${job.id}`,
        buyerId: clientId,
        sellerId: proposal.freelancerId,
        amount: proposalAmount,
        status: 'ACTIVE',
      },
    })

    // 3. Debit client wallet into Escrow
    try {
      await debitWallet(clientId, proposalAmount, 'FUND_ESCROW', {
        orderId: order.id,
        note: `Escrow funded for Job Contract #${order.id.slice(0, 8)} (${job.title})`,
        idempotencyKey: `job-order-fund-${order.id}`,
      })
    } catch (err: any) {
      console.warn(`Debit wallet fallback: ${err.message}`)
      const u = await db.user.findUnique({ where: { id: clientId } })
      if (u) {
        await db.user.update({
          where: { id: clientId },
          data: { walletBalance: Math.max(0, u.walletBalance - proposalAmount) },
        })
      }
    }

    // 4. Create milestone for the job order
    await db.milestone.create({
      data: {
        orderId: order.id,
        title: `Deliverable: ${job.title}`,
        amount: proposalAmount,
        percentage: 100,
        status: 'FUNDED',
        position: 1,
      },
    })

    // 5. Update accepted proposal & job status
    await db.proposal.update({
      where: { id: proposalId },
      data: { status: 'ACCEPTED' },
    })

    await db.job.update({
      where: { id: job.id },
      data: { status: 'IN_PROGRESS' as any },
    })

    // 6. Mark other pending proposals as REJECTED
    const otherProposals = await db.proposal.findMany({
      where: { jobId: job.id },
    })
    for (const other of otherProposals) {
      if (other.id !== proposalId && other.status === 'PENDING') {
        await db.proposal.update({
          where: { id: other.id },
          data: { status: 'REJECTED' },
        }).catch(() => {})
      }
    }

    // 7. Send notification & chat message to hired freelancer
    await db.notification.create({
      data: {
        userId: proposal.freelancerId,
        title: '🎉 Proposal Accepted & Hired!',
        message: `Congratulations! Your proposal for "${job.title}" (${proposalAmount} TND) was accepted. Order #${order.id.slice(0, 8)} is now active with funded escrow.`,
        type: 'PROPOSAL_ACCEPTED',
        link: `/dashboard/orders/${order.id}`,
      },
    }).catch(() => {})

    await db.message.create({
      data: {
        senderId: clientId,
        receiverId: proposal.freelancerId,
        content: `🎉 Proposal Accepted! I have hired you for "${job.title}". The project escrow (${proposalAmount} TND) is funded. Workspace: /dashboard/orders/${order.id}`,
        msgType: 'TEXT',
      },
    }).catch(() => {})

    // 8. Audit log
    await db.auditLog.create({
      data: {
        adminId: clientId,
        adminName: session.user.name || 'Client',
        action: 'JOB_PROPOSAL_ACCEPTED',
        targetId: order.id,
        details: `Client ${session.user.name} accepted proposal #${proposal.id} from freelancer #${proposal.freelancerId} for job "${job.title}" (${proposalAmount} TND)`,
      },
    }).catch(() => {})

    try {
      revalidatePath(`/jobs/${params.id}`)
      revalidatePath('/jobs')
      revalidatePath('/dashboard')
      revalidatePath('/dashboard/orders')
    } catch (e) {}

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: `Proposal accepted! Escrow (${proposalAmount} TND) funded and order created.`,
    })
  } catch (err: any) {
    console.error('PATCH /api/jobs/[id]/proposals:', err)
    return NextResponse.json({ error: err.message || 'Failed to process proposal' }, { status: 500 })
  }
}
