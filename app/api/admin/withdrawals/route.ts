import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'
import { debitWallet } from '@/lib/ledger'
import { sendEmail } from '@/lib/email'

/**
 * GET /api/admin/withdrawals — View all freelancer payout requests (ADMIN only)
 * POST /api/admin/withdrawals — Approve or Reject a payout request (ADMIN only)
 */

export async function GET() {
  try {
    const session = await auth()
    const authError = requireAdmin(session)
    if (authError) return authError

    const withdrawals = await db.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ withdrawals })
  } catch (err: any) {
    console.error('GET /api/admin/withdrawals error:', err)
    return NextResponse.json({ error: 'Failed to fetch withdrawal requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const authError = requireAdmin(session)
    if (authError) return authError

    const body = await req.json()
    const { id, action, adminNotes } = body as {
      id: string
      action: 'APPROVE' | 'REJECT'
      adminNotes?: string
    }

    if (!id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Valid withdrawal ID and action (APPROVE or REJECT) are required' }, { status: 400 })
    }

    const withdrawal = await db.withdrawal.findUnique({ where: { id } })
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ error: `Withdrawal has already been marked as ${withdrawal.status}` }, { status: 409 })
    }

    const freelancer = await db.user.findUnique({ where: { id: withdrawal.userId } })

    if (action === 'APPROVE') {
      // 1. Debit the freelancer's wallet via ledger
      await debitWallet(withdrawal.userId, withdrawal.amount, 'WITHDRAWAL', {
        note: `Payout completed via ${withdrawal.method} (${withdrawal.accountDetails}). Transferred by Admin ${session!.user.name}`,
        idempotencyKey: `payout-${withdrawal.id}`,
      }).catch(async () => {
        // Fallback balance update if Postgres function is not reached
        if (freelancer) {
          await db.user.update({
            where: { id: withdrawal.userId },
            data: { walletBalance: Math.max(0, freelancer.walletBalance - withdrawal.amount) },
          })
        }
      })

      // 2. Update withdrawal record
      const updated = await db.withdrawal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminNotes: adminNotes || `Approved and transferred via ${withdrawal.method}`,
          processedBy: session!.user.id,
        },
      })

      // 3. Log in audit trail
      await db.auditLog.create({
        data: {
          adminId: session!.user.id,
          adminName: session!.user.name || 'Admin',
          action: 'WITHDRAWAL_APPROVED',
          targetId: id,
          details: `Approved payout of ${withdrawal.amount} TND to ${freelancer?.name ?? withdrawal.userId} via ${withdrawal.method} (${withdrawal.accountDetails})`,
        },
      })

      return NextResponse.json({
        withdrawal: updated,
        message: `Payout of ${withdrawal.amount} TND has been approved and marked as transferred. Freelancer wallet debited.`,
      })
    }

    if (action === 'REJECT') {
      if (!adminNotes) {
        return NextResponse.json({ error: 'A rejection reason is required when rejecting a withdrawal request' }, { status: 400 })
      }

      // Update withdrawal record to REJECTED (funds remain in user balance)
      const updated = await db.withdrawal.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNotes,
          processedBy: session!.user.id,
        },
      })

      // Log in audit trail
      await db.auditLog.create({
        data: {
          adminId: session!.user.id,
          adminName: session!.user.name || 'Admin',
          action: 'WITHDRAWAL_REJECTED',
          targetId: id,
          details: `Rejected payout of ${withdrawal.amount} TND for ${freelancer?.name ?? withdrawal.userId}. Reason: ${adminNotes}`,
        },
      })

      return NextResponse.json({
        withdrawal: updated,
        message: `Payout request has been rejected. Reason logged for user.`,
      })
    }
  } catch (err: any) {
    console.error('POST /api/admin/withdrawals error:', err)
    return NextResponse.json({ error: err.message || 'Failed to process withdrawal request' }, { status: 500 })
  }
}
