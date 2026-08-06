import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search   = searchParams.get('q')
    const page     = parseInt(searchParams.get('page') ?? '1', 10)
    const limit    = parseInt(searchParams.get('limit') ?? '12', 10)
    const status   = searchParams.get('status') ?? 'OPEN'

    // 1. Build the Supabase query
    // We join the client (User table) and count the proposals simultaneously
    let query = supabase
      .from('Job')
      .select('*, client:User!clientId(name, image), proposals:Proposal(count)', { count: 'exact' })
      .eq('status', status)
      .order('createdAt', { ascending: false })

    // 2. Add filters if they exist
    if (category) {
      query = query.eq('category', category)
    }
    if (search) {
      query = query.ilike('title', `%${search}%`) // ilike does case-insensitive text search in Postgres
    }

    // 3. Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // 4. Execute the query
    const { data: jobs, count, error } = await query

    if (error) throw error

    const total = count ?? 0

    // 5. Format the data perfectly so your frontend UI components don't break
    const formattedJobs = jobs?.map((job: any) => ({
      ...job,
      client: Array.isArray(job.client) ? job.client[0] : job.client,
      _count: { proposals: job.proposals?.[0]?.count ?? 0 }
    })) ?? []

    return NextResponse.json({ 
      jobs: formattedJobs, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    })
  } catch (err) {
    console.error('GET /api/jobs:', err)
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // Authenticate the user securely via Supabase cookies
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, description, category, budget, deliveryDays, skills } = body

    if (!title || !description || !category || !budget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const formattedSkills = Array.isArray(skills) 
      ? skills 
      : skills?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? []

    // Insert the new job securely 
    const { data: job, error } = await supabase
      .from('Job')
      .insert({
        title,
        description,
        category,
        budget: parseFloat(budget),
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        skills: formattedSkills,
        clientId: user.id,
        status: 'OPEN'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(job, { status: 201 })
  } catch (err) {
    console.error('POST /api/jobs:', err)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}