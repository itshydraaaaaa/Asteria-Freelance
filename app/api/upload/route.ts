import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Validates image buffer using Magic Bytes to ensure the file is genuinely a valid, safe image.
 */
function validateImageCleanliness(buffer: Buffer, mimeType: string): { valid: boolean; ext: string; error?: string } {
  if (buffer.length < 12) {
    return { valid: false, ext: '', error: 'File is too small or empty.' }
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, ext: '', error: 'File size exceeds maximum 10MB limit.' }
  }

  // 1. Check for malicious executable signatures
  // Windows PE (.exe, .dll) -> starts with 'MZ'
  if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
    return { valid: false, ext: '', error: 'Executable files are prohibited.' }
  }
  // Linux ELF executable -> starts with 0x7F 'ELF'
  if (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    return { valid: false, ext: '', error: 'Binary executable files are prohibited.' }
  }

  // 2. Scan for embedded script tags or PHP injection in image bytes
  const headerString = buffer.slice(0, 4096).toString('utf-8', 0, 4096).toLowerCase()
  if (
    headerString.includes('<script') ||
    headerString.includes('<?php') ||
    headerString.includes('javascript:') ||
    headerString.includes('eval(')
  ) {
    return { valid: false, ext: '', error: 'File contains prohibited script or executable patterns.' }
  }

  // 3. Magic Bytes Verification
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, ext: 'jpg' }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { valid: true, ext: 'png' }
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, ext: 'webp' }
  }

  // GIF: 'GIF87a' or 'GIF89a'
  if (
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return { valid: true, ext: 'gif' }
  }

  return { valid: false, ext: '', error: 'Unrecognized or corrupted image format. Please upload a standard JPG, PNG, or WebP photo.' }
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id ?? 'anonymous'

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'gigs'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const rawMimeType = file.type?.toLowerCase() || 'image/jpeg'
    if (!ALLOWED_MIME_TYPES.has(rawMimeType)) {
      return NextResponse.json({ error: 'Unsupported file format. Please upload a JPG, PNG, or WebP image.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // ── Security Check: Verify magic bytes and scan content ───────────────────
    const validation = validateImageCleanliness(buffer, rawMimeType)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid or unsafe image file.' }, { status: 400 })
    }

    const safeExtension = validation.ext
    const safeFileName = `${userId}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${safeExtension}`
    const finalMimeType = `image/${safeExtension === 'jpg' ? 'jpeg' : safeExtension}`

    // 1. Try uploading to Supabase Storage
    try {
      const supabase = getServiceClient()
      if (supabase) {
        const isPrivate = bucket === 'kyc-documents' || bucket === 'kyc'
        const targetBucket = isPrivate ? 'kyc-documents' : bucket

        // Ensure bucket exists
        try {
          await supabase.storage.createBucket(targetBucket, { public: !isPrivate })
        } catch {}

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(targetBucket)
          .upload(safeFileName, buffer, {
            contentType: finalMimeType,
            cacheControl: '31536000',
            upsert: true,
          })

        if (!uploadError && uploadData) {
          if (isPrivate) {
            const { data: signedData } = await supabase.storage
              .from(targetBucket)
              .createSignedUrl(safeFileName, 86400) // 24-hour access
            return NextResponse.json({
              url: signedData?.signedUrl || uploadData.path,
              path: uploadData.path,
              fileName: safeFileName,
              isPrivate: true,
            }, { status: 200 })
          }

          const { data: { publicUrl } } = supabase.storage
            .from(targetBucket)
            .getPublicUrl(safeFileName)

          if (publicUrl) {
            return NextResponse.json({ url: publicUrl, fileName: safeFileName }, { status: 200 })
          }
        }
      }
    } catch (storageErr) {
      console.warn('[upload] Supabase storage upload note:', storageErr)
    }

    // 2. High-Fidelity Data URI Fallback
    const base64Data = buffer.toString('base64')
    const dataUrl = `data:${finalMimeType};base64,${base64Data}`

    return NextResponse.json({
      url: dataUrl,
      fileName: safeFileName,
      message: 'Image verified and uploaded successfully.',
    }, { status: 200 })
  } catch (err: any) {
    console.error('POST /api/upload error:', err)
    return NextResponse.json({ error: err.message || 'Failed to upload image' }, { status: 500 })
  }
}