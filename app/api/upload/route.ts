import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    
    // 1. Verify the user is securely logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Grab the file and the target bucket from the request
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = (formData.get('bucket') as string) || 'avatars' // Defaults to avatars

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 3. Create a clean, unique filename to prevent overwriting
    // Format: "userId-timestamp.jpg"
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    // 4. Upload the file to the chosen Supabase bucket
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error("Supabase storage error:", uploadError)
      throw uploadError
    }

    // 5. Generate the public URL so the frontend can display the image instantly
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (err) {
    console.error('POST /api/upload:', err)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}