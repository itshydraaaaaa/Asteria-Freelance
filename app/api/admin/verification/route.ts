import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const verifications = await db.verification.findMany({ orderBy: { submittedAt: 'desc' } })
    return NextResponse.json({ verifications })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, status, rejectionReason } = body

    if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid verification status decision' }, { status: 400 })
    }

    const updated = await db.verification.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Documents rejected by admin review') : undefined
      }
    })

    // Write to audit log
    await db.auditLog.create({
      data: {
        adminId: session?.user?.id ?? 'admin1',
        adminName: session?.user?.name || 'Admin',
        action: `IDENTITY_${status}`,
        details: `Identity verification for user ID ${updated?.userId} marked as ${status}${rejectionReason ? ` (${rejectionReason})` : ''}`
      }
    })

    return NextResponse.json({ verification: updated, message: `Verification status updated to ${status}` })
  } catch (err) {
    console.error('Admin verification update error:', err)
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 })
  }
}
