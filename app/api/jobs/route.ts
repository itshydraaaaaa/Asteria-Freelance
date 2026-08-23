import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search   = searchParams.get('q')
    const status   = searchParams.get('status') ?? 'OPEN'

    const jobs = await db.job.findMany({ where: { status } })

    let result = jobs
    if (category && category !== 'All Categories') {
      result = result.filter((j) => j.category?.toLowerCase() === category.toLowerCase())
    }
    if (search) {
      result = result.filter((j) =>
        j.title?.toLowerCase().includes(search.toLowerCase()) ||
        j.description?.toLowerCase().includes(search.toLowerCase()) ||
        (Array.isArray(j.skills) && j.skills.some((s: string) => s.toLowerCase().includes(search.toLowerCase())))
      )
    }

    return NextResponse.json({ jobs: result, total: result.length, page: 1, totalPages: 1 })
  } catch (err) {
    console.error('GET /api/jobs:', err)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to post a job' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (user && user.verifiedStatus !== 'APPROVED' && user.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'Identity verification required. You can watch and explore until your KYC is approved.'
      }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, category, budget, deliveryDays, skills } = body

    if (!title || !description || !category || !budget) {
      return NextResponse.json({ error: 'Missing required fields: title, description, category, budget' }, { status: 400 })
    }

    const numericBudget = parseFloat(budget)
    if (isNaN(numericBudget) || numericBudget <= 0) {
      return NextResponse.json({ error: 'Budget must be a positive number' }, { status: 400 })
    }

    // Strict Wallet Balance Enforcement: Client cannot post a job exceeding their available balance
    const userBalance = Number(user?.walletBalance ?? 0)
    if (numericBudget > userBalance) {
      return NextResponse.json({
        error: `Insufficient wallet balance. You have ${userBalance.toFixed(2)} TND in your account, but this job requires a budget of ${numericBudget.toFixed(2)} TND. Please top up your wallet to post this job.`,
        currentBalance: userBalance,
        requiredBudget: numericBudget,
      }, { status: 402 })
    }

    const formattedSkills = Array.isArray(skills)
      ? skills
      : skills?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? []

    const job = await db.job.create({
      data: {
        title,
        description,
        category,
        budget: numericBudget,
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        skills: formattedSkills,
        clientId: session.user.id,
        status: 'OPEN',
      }
    })

    // Revalidate paths so the new job immediately appears on the job board
    try {
      revalidatePath('/jobs')
      revalidatePath('/post-job')
      revalidatePath('/dashboard')
      revalidatePath('/')
      revalidatePath('/api/jobs')
    } catch (e) {}

    return NextResponse.json(job, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/jobs:', err)
    return NextResponse.json({ error: err.message || 'Failed to create job' }, { status: 500 })
  }
}