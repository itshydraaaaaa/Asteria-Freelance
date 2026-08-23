import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'
import { requireAuth } from '@/lib/authz'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ error: 'Missing required identity details (Full name, Date of birth, Country, Document type, Document number).' }, { status: 400 })
    }

    const front = idFrontPath || idFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'
    const back  = idBackPath  || idBackUrl  || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'
    const selfie = selfiePath || selfieUrl  || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'

    // Check existing verification record
    const existing = await db.verification.findUnique({ where: { userId: session!.user.id } })

    let verification
    if (existing) {
      // Update existing record with new details and set back to PENDING for review
      verification = await db.verification.update({
        where: { id: existing.id },
        data: {
          fullName,
          dob,
          country,
          documentType,
          documentNumber,
          idFrontPath: front,
          idBackPath:  back,
          selfiePath:  selfie,
          status:      'PENDING',
          rejectionReason: undefined,
          reviewedBy:      undefined,
          reviewedAt:      undefined,
          submittedAt:     new Date(),
        } as any,
      })
    } else {
      // Create new verification submission
      verification = await db.verification.create({
        data: {
          userId:         session!.user.id,
          fullName,
          dob,
          country,
          documentType,
          documentNumber,
          idFrontPath:    front,
          idBackPath:     back,
          selfiePath:     selfie,
          status:         'PENDING',
        },
      })
    }

    // Ensure User verifiedStatus is synced to PENDING
    await db.user.update({
      where: { id: session!.user.id },
      data: { verifiedStatus: 'PENDING' },
    })

    try {
      const { revalidatePath } = await import('next/cache')
      revalidatePath('/dashboard/verification')
      revalidatePath('/dashboard/admin')
      revalidatePath('/dashboard')
    } catch (e) {}

    return NextResponse.json(
      { verification, message: 'Identity verification submitted successfully for review.' },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('POST /api/user/verification error:', err)
    return NextResponse.json({ error: err.message || 'Failed to submit verification' }, { status: 500 })
  }
}
