import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'
import { creditWallet } from '@/lib/ledger'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const HIGH_VALUE_WITHDRAWAL_THRESHOLD = Number(process.env.HIGH_VALUE_WITHDRAWAL_THRESHOLD) || 1000

/**
 * GET /api/admin/withdrawals — View all freelancer payout requests (ADMIN only)
 * POST /api/admin/withdrawals — Approve or Reject a payout request with High-Value Maker-Checker Dual Control (Task 6.2)
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

    const currentAdminId = session!.user.id
    const currentAdminName = session!.user.name || 'Administrator'

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

    if (withdrawal.status === 'APPROVED' || withdrawal.status === 'REJECTED') {
      return NextResponse.json({ error: `Withdrawal has already been marked as ${withdrawal.status}` }, { status: 409 })
    }

    const freelancer = await db.user.findUnique({ where: { id: withdrawal.userId } })
    const isHighValue = withdrawal.amount >= HIGH_VALUE_WITHDRAWAL_THRESHOLD

    if (action === 'APPROVE') {
      // ─── HIGH-VALUE MAKER-CHECKER WORKFLOW (Task 6.2) ──────────────────────
      if (isHighValue) {
        if (withdrawal.status === 'PENDING') {
          // STEP 1: Maker Approval
          const updated = await db.withdrawal.update({
            where: { id },
            data: {
              status: 'PENDING_SECOND_APPROVAL',
              makerAdminId: currentAdminId,
              makerAdminName: currentAdminName,
              adminNotes: adminNotes || `Maker approval by ${currentAdminName}. Pending second checker.`,
            },
          })

          logger.security('WITHDRAWAL_MAKER_APPROVAL', `High-value withdrawal #${id} (${withdrawal.amount} TND) approved by Maker Admin #${currentAdminId}`, {
            adminId: currentAdminId,
            withdrawalId: id,
            amount: withdrawal.amount,
            status: 'PENDING_SECOND_APPROVAL',
          })

          return NextResponse.json({
            withdrawal: updated,
            isMakerStep: true,
            message: `High-value withdrawal of ${withdrawal.amount.toFixed(2)} TND recorded (Step 1/2: Maker). A second distinct administrator must approve to complete payout transfer.`,
          })
        }

        if (withdrawal.status === 'PENDING_SECOND_APPROVAL') {
          // STEP 2: Checker Approval — Must be a DIFFERENT admin
          if (withdrawal.makerAdminId === currentAdminId) {
            return NextResponse.json(
              {
                error: 'Maker-Checker policy violation: The same administrator who performed the initial Maker approval cannot provide the second Checker approval. A different administrator is required.',
              },
              { status: 403 }
            )
          }

          // Complete final approval
          const updated = await db.withdrawal.update({
            where: { id },
            data: {
              status: 'APPROVED',
              checkerAdminId: currentAdminId,
              checkerAdminName: currentAdminName,
              processedBy: currentAdminId,
              adminNotes: adminNotes || `Dual-approved by Maker (${withdrawal.makerAdminName || withdrawal.makerAdminId}) and Checker (${currentAdminName})`,
            },
          })

          logger.security('WITHDRAWAL_CHECKER_FINAL_APPROVAL', `High-value withdrawal #${id} (${withdrawal.amount} TND) finalized by Checker Admin #${currentAdminId}`, {
            makerAdminId: withdrawal.makerAdminId,
            checkerAdminId: currentAdminId,
            withdrawalId: id,
            amount: withdrawal.amount,
          })

          return NextResponse.json({
            withdrawal: updated,
            message: `High-value payout of ${withdrawal.amount.toFixed(2)} TND dual-approved and completed successfully.`,
          })
        }
      }

      // ─── STANDARD VALUE APPROVAL (< 1000 TND) ──────────────────────────────
      const updated = await db.withdrawal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminNotes: adminNotes || `Approved and transferred via ${withdrawal.method}`,
          processedBy: currentAdminId,
        },
      })

      logger.audit('WITHDRAWAL_APPROVED', `Admin #${currentAdminId} approved payout of ${withdrawal.amount} TND to ${freelancer?.name ?? withdrawal.userId}`, {
        adminId: currentAdminId,
        withdrawalId: id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        method: withdrawal.method,
      })

      return NextResponse.json({
        withdrawal: updated,
        message: `Payout of ${withdrawal.amount.toFixed(2)} TND has been approved and marked as transferred.`,
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
          processedBy: currentAdminId,
        },
      })

      // 3. Log in audit trail
      logger.audit('WITHDRAWAL_REJECTED', `Admin #${currentAdminId} rejected payout of ${withdrawal.amount} TND. Funds refunded to user balance.`, {
        adminId: currentAdminId,
        withdrawalId: id,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        reason: adminNotes,
      })

      return NextResponse.json({
        withdrawal: updated,
        message: `Payout request rejected. Funds (${withdrawal.amount.toFixed(2)} TND) have been refunded to user wallet.`,
      })
    }
  } catch (err: any) {
    logger.error('ADMIN_WITHDRAWAL_ACTION_FAILED', `Failed to process withdrawal request: ${err.message}`, { error: err })
    return NextResponse.json({ error: err.message || 'Failed to process withdrawal request' }, { status: 500 })
  }
}
