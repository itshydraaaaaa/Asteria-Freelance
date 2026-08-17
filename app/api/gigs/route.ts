import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/authz'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search   = searchParams.get('q')

    let result = await db.gig.findMany()
    if (category) result = result.filter((g: any) => g.category?.toLowerCase() === category.toLowerCase())
    if (search)   result = result.filter((g: any) => g.title?.toLowerCase().includes(search.toLowerCase()))

    return NextResponse.json({ gigs: result, total: result.length, page: 1, totalPages: 1 })
  } catch (err) {
    console.error('GET /api/gigs:', err)
    return NextResponse.json({ error: 'Failed to load gigs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    // ── Server-side authorization: FREELANCER role required ─────────────────
    const authzError = requireRole(session, 'FREELANCER')
    if (authzError) return authzError

    const body = await req.json()
    const { title, description, category, price, deliveryDays, tags, image } = body

    if (!title || !description || !category || !price) {
      return NextResponse.json({ error: 'Missing required fields: title, description, category, price' }, { status: 400 })
    }

    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
    }

    const formattedTags = Array.isArray(tags)
      ? tags
      : tags?.split(',').map((t: string) => t.trim()).filter(Boolean) ?? []

    const gig = await db.gig.create({
      data: {
        title,
        description,
        category,
        price: numericPrice,
        deliveryDays: parseInt(deliveryDays ?? 7, 10),
        tags: formattedTags,
        image: image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        freelancerId: session!.user.id,
      },
    })

    return NextResponse.json(gig, { status: 201 })
  } catch (err) {
    console.error('POST /api/gigs:', err)
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 })
  }
}