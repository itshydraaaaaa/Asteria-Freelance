import { NextRequest, NextResponse } from 'next/server'
import { auth }           from '@/lib/auth'
import { db }             from '@/lib/db'
import { requireAdmin }   from '@/lib/authz'

/**
 * GET /api/admin/verification — List all KYC submissions
 * POST /api/admin/verification — Approve or Reject a submission
 *
 * Both endpoints require ADMIN role enforced server-side.
 * Every admin VIEW of a document is logged to audit_logs (KYC_VIEWED).
 */

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    // ── Server-side authorization: ADMIN only ─────────────────────────────
    const authzError = requireAdmin(session)
    if (authzError) return authzError

    const verifications = await db.verification.findMany({})

    // Log that an admin listed all KYC submissions
    await db.auditLog.create({
      data: {
        adminId:   session!.user.id,
        adminName: session!.user.name || 'Admin',
        action:    'KYC_LIST_VIEWED',
        details:   `Admin viewed KYC submission list (${verifications.length} items)`,
      }
    }).catch(() => {})  // Non-blocking audit log

    return NextResponse.json({ verifications })
  } catch (err) {
    console.error('GET /api/admin/verification:', err)
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    // ── Server-side authorization: ADMIN only ─────────────────────────────
    const authzError = requireAdmin(session)
    if (authzError) return authzError

    const body = await req.json()
    const { id, status, rejectionReason } = body

    if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid verification status decision' }, { status: 400 })
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return NextResponse.json({ error: 'A rejection reason is required when rejecting a KYC submission' }, { status: 400 })
    }

    const updated = await db.verification.update({
      where: { id },
      data: {
        status,
        reviewedBy:      session!.user.id,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      }
    })

    if (!updated) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 })
    }

    // Write to audit log — KYC_APPROVED or KYC_REJECTED
    await db.auditLog.create({
      data: {
        adminId:   session!.user.id,
        adminName: session!.user.name || 'Admin',
        action:    `KYC_${status}`,
        targetId:  id,
        details:   `KYC for user ${updated.userId} ${status.toLowerCase()}${status === 'REJECTED' ? `: ${rejectionReason}` : ''}`,
      }
    })

    return NextResponse.json({
      verification: updated,
      message: `Verification ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully.`,
    })
  } catch (err) {
    console.error('POST /api/admin/verification:', err)
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 })
  }
}
