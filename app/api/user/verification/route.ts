import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const verification = await db.verification.findFirst({
      where: { userId: session.user.id }
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fullName, dob, country, documentType, documentNumber, idFrontUrl, idBackUrl, selfieUrl } = body

    if (!fullName || !dob || !country || !documentType || !documentNumber) {
      return NextResponse.json({ error: 'Missing required document details' }, { status: 400 })
    }

    // Check existing
    const existing = await db.verification.findFirst({ where: { userId: session.user.id } })
    if (existing && existing.status === 'PENDING') {
      return NextResponse.json({ error: 'Verification request already pending approval' }, { status: 400 })
    }

    const verification = await db.verification.create({
      data: {
        userId: session.user.id,
        fullName,
        dob,
        country,
        documentType,
        documentNumber,
        idFrontUrl: idFrontUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        idBackUrl: idBackUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        selfieUrl: selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      }
    })

    return NextResponse.json({ verification, message: 'Identity verification submitted successfully' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/user/verification error:', err)
    return NextResponse.json({ error: 'Failed to submit verification' }, { status: 500 })
  }
}
