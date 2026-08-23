import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: gig, error } = await supabase
      .from('Gig')
      .select('*, freelancer:User!freelancerId(name, bio, image)')
      .eq('id', params.id)
      .single()

    if (error || !gig) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const formattedGig = {
      ...gig,
      freelancer: Array.isArray(gig.freelancer) ? gig.freelancer[0] : gig.freelancer
    }

    return NextResponse.json(formattedGig)
  } catch {
    return NextResponse.json({ error: 'Failed to load gig' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership or Admin status securely
    const { data: gig } = await supabase.from('Gig').select('freelancerId').eq('id', params.id).single()
    if (!gig) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const role = user.user_metadata?.role ?? 'CLIENT'
    if (gig.freelancerId !== user.id && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, category, price, deliveryDays, tags } = body

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (price !== undefined) updates.price = parseFloat(price)
    if (deliveryDays !== undefined) updates.deliveryDays = parseInt(deliveryDays, 10)
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()).filter(Boolean)

    const { data: updated, error } = await supabase
      .from('Gig')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/gigs/[id]:', err)
    return NextResponse.json({ error: 'Failed to update gig' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: gig } = await supabase.from('Gig').select('freelancerId').eq('id', params.id).single()
    if (!gig) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const role = user.user_metadata?.role ?? 'CLIENT'
    if (gig.freelancerId !== user.id && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase.from('Gig').delete().eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/gigs/[id]:', err)
    return NextResponse.json({ error: 'Failed to delete gig' }, { status: 500 })
  }
}