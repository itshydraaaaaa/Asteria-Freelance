import { NextRequest, NextResponse } from 'next/server'
import { auth }          from '@/lib/auth'
import { db }            from '@/lib/db'
import { requireRole }   from '@/lib/authz'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search   = searchParams.get('q')

    // Gigs are served from static data (lib/data/gigs.ts) — public, no auth needed
    // Dynamic gigs created by freelancers are stored separately (future: merge with static)
    const { gigs } = await import('@/lib/data/gigs')
    let result = [...gigs]
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

    // Insert into gigs table (to be added to migration — for now returns mock)
    const gig = {
      id:           `gig_${Date.now()}`,
      title,
      description,
      category,
      price:        numericPrice,
      deliveryDays: parseInt(deliveryDays ?? 7, 10),
      tags:         formattedTags,
      image:        image ?? null,
      freelancerId: session!.user.id,
      freelancer:   { name: session!.user.name, image: session!.user.image },
      rating:       5.0,
      reviewCount:  0,
      createdAt:    new Date(),
    }

    return NextResponse.json(gig, { status: 201 })
  } catch (err) {
    console.error('POST /api/gigs:', err)
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 })
  }
}