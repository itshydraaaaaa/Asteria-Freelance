import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search   = searchParams.get('q')

    let dbGigs = await db.gig.findMany()
    if (category) dbGigs = dbGigs.filter((g: any) => g.category.toLowerCase() === category.toLowerCase())
    if (search)   dbGigs = dbGigs.filter((g: any) => g.title.toLowerCase().includes(search.toLowerCase()))

    return NextResponse.json({ gigs: dbGigs, total: dbGigs.length, page: 1, totalPages: 1 })
  } catch (err) {
    console.error('GET /api/gigs:', err)
    return NextResponse.json({ error: 'Failed to load gigs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { title, description, category, price, deliveryDays, tags, image } = body

    if (!title || !description || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const formattedTags = Array.isArray(tags) ? tags : tags?.split(',').map((t: string) => t.trim()).filter(Boolean) ?? []

    // 1. Create in unified db store
    const gig = await db.gig.create({
      data: {
        title,
        description,
        category,
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        tags: formattedTags,
        image: image ?? null,
        freelancerId: userId,
      }
    })

    // 2. Try Supabase cloud insert if available
    try {
      const supabase = createClient()
      await supabase.from('Gig').insert({
        title,
        description,
        category,
        price: parseFloat(price),
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        tags: formattedTags,
        image: image ?? null,
        freelancerId: userId,
      })
    } catch (e) {}

    return NextResponse.json(gig, { status: 201 })
  } catch (err) {
    console.error('POST /api/gigs:', err)
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 })
  }
}