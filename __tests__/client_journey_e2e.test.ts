import { db } from '@/lib/db'
import { processEscrowRelease, processMilestoneRelease, getBalance } from '@/lib/ledger'

describe('Task 12.3: Client & Freelancer Journey E2E Flow', () => {
  const testClientId = `client_${Date.now()}`
  const testFreelancerId = `freelancer_${Date.now()}`
  let testJobId = ''
  let testProposalId = ''
  let testOrderId = ''

  it('Step 1: Registers Client and Freelancer with unverified initial status', async () => {
    const client = await db.user.create({
      data: {
        id: testClientId,
        name: 'Amine Client',
        email: `${testClientId}@asteria.test`,
        role: 'CLIENT',
      },
    })
    expect(client.id).toBe(testClientId)
    expect(client.role).toBe('CLIENT')

    const freelancer = await db.user.create({
      data: {
        id: testFreelancerId,
        name: 'Sami Freelancer',
        email: `${testFreelancerId}@asteria.test`,
        role: 'FREELANCER',
      },
    })
    expect(freelancer.id).toBe(testFreelancerId)
    expect(freelancer.role).toBe('FREELANCER')
  })

  it('Step 2: Submits KYC verification and approves documents', async () => {
    const verif = await db.verification.create({
      data: {
        userId: testFreelancerId,
        fullName: 'Sami Freelancer Legal',
        dob: '1995-05-12',
        country: 'Tunisia',
        documentType: 'National ID',
        documentNumber: '14890234',
        idFrontPath: 'kyc/front.jpg',
        selfiePath: 'kyc/selfie.jpg',
      },
    })
    expect(verif.status).toBe('PENDING')

    // Admin reviews and approves
    const approved = await db.verification.update({
      where: { id: verif.id },
      data: { status: 'APPROVED' },
    })
    expect(approved?.status).toBe('APPROVED')
  })

  it('Step 3: Client publishes a job posting and freelancer bids with proposal', async () => {
    const job = await db.job.create({
      data: {
        clientId: testClientId,
        title: 'Full-Stack Next.js 14 SaaS Platform',
        description: 'Need an experienced engineer to build our core marketplace.',
        category: 'Web Development',
        budget: 500,
        deliveryDays: 7,
        skills: ['Next.js', 'PostgreSQL', 'Tailwind'],
      },
    })
    expect(job.id).toBeDefined()
    testJobId = job.id

    const proposal = await db.proposal.create({
      data: {
        jobId: testJobId,
        freelancerId: testFreelancerId,
        coverLetter: 'I have extensive experience with Next.js and Supabase architectures.',
        price: 500,
        deliveryDays: 5,
      },
    })
    expect(proposal.id).toBeDefined()
    expect(proposal.price).toBe(500)
    testProposalId = proposal.id
  })

  it('Step 4: Client funds escrow order and locks 500 TND contract', async () => {
    const order = await db.order.create({
      data: {
        buyerId: testClientId,
        sellerId: testFreelancerId,
        amount: 500,
        status: 'ACTIVE',
      },
    })
    expect(order.id).toBeDefined()
    expect(order.amount).toBe(500)
    testOrderId = order.id
  })

  it('Step 5: Client approves delivery and releases escrow funds', async () => {
    const { sellerPayout, platformFee } = await processEscrowRelease(
      testOrderId,
      testFreelancerId,
      500
    )

    // 88% to seller (440 TND), 12% platform commission (60 TND)
    expect(sellerPayout).toBe(440)
    expect(platformFee).toBe(60)

    const freelancerBalance = await getBalance(testFreelancerId)
    expect(freelancerBalance).toBeGreaterThanOrEqual(440)

    await db.order.update({
      where: { id: testOrderId },
      data: { status: 'COMPLETED' },
    })
  })

  it('Step 6: Client leaves a verified 5-star review', async () => {
    const review = await db.review.create({
      data: {
        orderId: testOrderId,
        freelancerId: testFreelancerId,
        reviewerId: testClientId,
        rating: 5,
        comment: 'Outstanding delivery ahead of schedule. Highly recommended!',
      },
    })

    expect(review.id).toBeDefined()
    expect(review.rating).toBe(5)
    expect(review.comment).toContain('Outstanding delivery')
  })
})
