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

    let result = await db.gig.findMany()
    if (category && category !== 'All Categories') {
      result = result.filter((g: any) => g.category?.toLowerCase() === category.toLowerCase())
    }
    if (search) {
      result = result.filter((g: any) =>
        g.title?.toLowerCase().includes(search.toLowerCase()) ||
        (Array.isArray(g.tags) && g.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())))
      )
    }

    return NextResponse.json({ gigs: result, total: result.length, page: 1, totalPages: 1 })
  } catch (err) {
    console.error('GET /api/gigs:', err)
    return NextResponse.json({ error: 'Failed to load gigs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to create a gig' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (user && user.verifiedStatus !== 'APPROVED' && user.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'Identity verification required. You can watch and explore until your KYC is approved.'
      }, { status: 403 })
    }

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
        freelancerId: session.user.id,
      },
    })

    // Revalidate paths so the new gig immediately appears across the marketplace
    try {
      revalidatePath('/explore')
      revalidatePath('/dashboard/gigs')
      revalidatePath('/')
      revalidatePath('/api/gigs')
    } catch (e) {}

    return NextResponse.json(gig, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/gigs:', err)
    return NextResponse.json({ error: err.message || 'Failed to create gig' }, { status: 500 })
  }
}