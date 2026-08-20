import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { requireAuth } from '@/lib/authz'

export async function GET() {
  try {
    const session = await auth()
    const authError = requireAuth(session)
    if (authError) return authError

    const verification = await db.verification.findUnique({
      where: { userId: session!.user.id }
    })

    return NextResponse.json({ verification })
  } catch (err) {
    console.error('GET /api/user/verification error:', err)
    return NextResponse.json({ error: 'Failed to fetch verification status' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const authError = requireAuth(session)
    if (authError) return authError

    const body = await req.json()
    const {
      fullName,
      dob,
      country,
      documentType,
      documentNumber,
      idFrontPath,
      idBackPath,
      selfiePath,
      idFrontUrl,
      idBackUrl,
      selfieUrl,
    } = body

    if (!fullName || !dob || !country || !documentType || !documentNumber) {
      return NextResponse.json({ error: 'Missing required document details' }, { status: 400 })
    }

    // Check existing pending request
    const existing = await db.verification.findUnique({ where: { userId: session!.user.id } })
    if (existing && existing.status === 'PENDING') {
      return NextResponse.json({ error: 'A verification request is already pending review' }, { status: 400 })
    }

    const verification = await db.verification.create({
      data: {
        userId:         session!.user.id,
        fullName,
        dob,
        country,
        documentType,
        documentNumber,
        idFrontPath:    idFrontPath || idFrontUrl || 'kyc-documents/placeholder_front.jpg',
        idBackPath:     idBackPath  || idBackUrl  || 'kyc-documents/placeholder_back.jpg',
        selfiePath:     selfiePath  || selfieUrl  || 'kyc-documents/placeholder_selfie.jpg',
        status:         'PENDING',
      }
    })

    try {
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/dashboard/verification')
      revalidatePath('/dashboard/admin')
      revalidatePath('/dashboard')
    } catch (e) {}

    return NextResponse.json(
      { verification, message: 'Identity verification submitted successfully for review.' },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/user/verification error:', err)
    return NextResponse.json({ error: 'Failed to submit verification' }, { status: 500 })
  }
}
