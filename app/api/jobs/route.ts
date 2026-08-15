import { NextRequest, NextResponse } from 'next/server'
import { auth }          from '@/lib/auth'
import { db }            from '@/lib/db'
import { requireRole }   from '@/lib/authz'
import { rateLimit }     from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search   = searchParams.get('q')
    const status   = searchParams.get('status') ?? 'OPEN'

    const jobs = await db.job.findMany({ where: { status } })

    let result = jobs
    if (category) result = result.filter((j) => j.category?.toLowerCase() === category.toLowerCase())
    if (search)   result = result.filter((j) => j.title?.toLowerCase().includes(search.toLowerCase()))

    return NextResponse.json({ jobs: result, total: result.length, page: 1, totalPages: 1 })
  } catch (err) {
    console.error('GET /api/jobs:', err)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    // ── Server-side authorization: CLIENT role required ──────────────────────
    const authzError = requireRole(session, 'CLIENT')
    if (authzError) return authzError

    // ── Rate limiting: 3 job posts per minute per user ───────────────────────
    const rateLimited = await rateLimit(session!.user.id, '/api/jobs')
    if (rateLimited) return rateLimited

    const body = await req.json()
    const { title, description, category, budget, deliveryDays, skills } = body

    if (!title || !description || !category || !budget) {
      return NextResponse.json({ error: 'Missing required fields: title, description, category, budget' }, { status: 400 })
    }

    const numericBudget = parseFloat(budget)
    if (isNaN(numericBudget) || numericBudget <= 0) {
      return NextResponse.json({ error: 'Budget must be a positive number' }, { status: 400 })
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
        clientId: session!.user.id,
        status: 'OPEN',
      }
    })

    return NextResponse.json(job, { status: 201 })
  } catch (err) {
    console.error('POST /api/jobs:', err)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}