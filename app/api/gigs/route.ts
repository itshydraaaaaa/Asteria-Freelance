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

    let query = supabase
      .from('Gig')
      // 👉 Added image to the freelancer join so avatars show on the explore page
      .select('*, freelancer:User!freelancerId(name, image)', { count: 'exact' })
      .order('featured', { ascending: false })
      .order('createdAt', { ascending: false })

    if (category) query = query.eq('category', category)
    if (search)   query = query.ilike('title', `%${search}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: gigs, count, error } = await query
    if (error) throw error

    const total = count ?? 0
    
    const formattedGigs = gigs?.map((gig: any) => ({
      ...gig,
      freelancer: Array.isArray(gig.freelancer) ? gig.freelancer[0] : gig.freelancer
    })) ?? []

    return NextResponse.json({ gigs: formattedGigs, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('GET /api/gigs:', err)
    return NextResponse.json({ error: 'Failed to load gigs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    // 👉 Added "image" to the incoming body parameters
    const { title, description, category, price, deliveryDays, tags, image } = body

    if (!title || !description || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const formattedTags = Array.isArray(tags) ? tags : tags?.split(',').map((t: string) => t.trim()).filter(Boolean) ?? []

    const { data: gig, error } = await supabase
      .from('Gig')
      .insert({
        title,
        description,
        category,
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        tags: formattedTags,
        image: image ?? null, // 👉 Save the cropped image to the database!
        freelancerId: user.id, // 👉 Removed the invalid clientId
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase Insert Error:", error)
      throw error
    }

    return NextResponse.json(gig, { status: 201 })
  } catch (err) {
    console.error('POST /api/gigs:', err)
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 })
  }
}