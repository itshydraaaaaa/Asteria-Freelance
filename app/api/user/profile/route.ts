import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Securely identify the user through Supabase cookies
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, bio, skills, hourlyRate, location, website, languages, image } = body

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (bio !== undefined) updates.bio = bio
    if (location !== undefined) updates.location = location
    if (website !== undefined) updates.website = website
    if (languages !== undefined) updates.languages = Array.isArray(languages) ? languages : languages.split(',').map((l: string) => l.trim()).filter(Boolean)
    if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null
    if (image !== undefined) updates.image = image

    // Update their public profile
    const { data: updated, error } = await supabase
      .from('User')
      .update(updates)
      .eq('id', user.id)
      .select('id, name, bio, skills, hourlyRate, location, website, languages')
      .single()

    if (error) throw error

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/user/profile:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}