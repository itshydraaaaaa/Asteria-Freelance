import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'
import { creditWallet } from '@/lib/ledger'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

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
      // 1. Update withdrawal record (funds were held upon user request)
      const updated = await db.withdrawal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminNotes: adminNotes || `Approved and transferred via ${withdrawal.method}`,
          processedBy: session!.user.id,
        },
      })

      // 2. Log in audit trail
      logger.audit('WITHDRAWAL_APPROVED', `Admin #${session!.user.id} approved payout of ${withdrawal.amount} TND to ${freelancer?.name ?? withdrawal.userId}`, {
        adminId: session!.user.id,
        withdrawalId: id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        method: withdrawal.method,
      })

      return NextResponse.json({
        withdrawal: updated,
        message: `Payout of ${withdrawal.amount} TND has been approved and marked as transferred.`,
      })
    }

    if (action === 'REJECT') {
      if (!adminNotes) {
        return NextResponse.json({ error: 'A rejection reason is required when rejecting a withdrawal request' }, { status: 400 })
      }

      // 1. Refund the held funds back to the user's available wallet balance
      await creditWallet(withdrawal.userId, withdrawal.amount, 'REFUND', {
        note: `Withdrawal #${withdrawal.id} rejected by Admin: ${adminNotes}`,
        idempotencyKey: `refund-with-${withdrawal.id}`,
      })

      // 2. Update withdrawal record to REJECTED
      const updated = await db.withdrawal.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNotes,
          processedBy: session!.user.id,
        },
      })

      // 3. Log in audit trail
      logger.audit('WITHDRAWAL_REJECTED', `Admin #${session!.user.id} rejected payout of ${withdrawal.amount} TND. Funds refunded to user balance.`, {
        adminId: session!.user.id,
        withdrawalId: id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        reason: adminNotes,
      })

      return NextResponse.json({
        withdrawal: updated,
        message: `Payout request rejected. Funds (${withdrawal.amount} TND) have been refunded to user wallet.`,
      })
    }
  } catch (err: any) {
    logger.error('ADMIN_WITHDRAWAL_ACTION_FAILED', `Failed to process withdrawal request: ${err.message}`, { error: err })
    return NextResponse.json({ error: err.message || 'Failed to process withdrawal request' }, { status: 500 })
  }
}
