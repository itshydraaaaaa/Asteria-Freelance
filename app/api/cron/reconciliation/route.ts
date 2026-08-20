import { NextRequest, NextResponse } from 'next/server'
import { getReconciliationReport } from '@/lib/ledger'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/reconciliation — Automated Scheduled Ledger Reconciliation & SLA Auditing
 *
 * Runs automatically via Vercel Cron or scheduled HTTP job.
 * Enforces CRON_SECRET authorization header in production.
 * Automatically dispatches high-priority paging alerts if:
 * 1. Balance anomaly or escrow drift is detected.
 * 2. Pending withdrawal requests exceed the SLA review threshold (Task 1.5).
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 })
    }

    const report = await getReconciliationReport()

    // 1. Withdrawal Hold SLA Audit (Task 1.5)
    const slaHours = Number(process.env.WITHDRAWAL_SLA_HOURS) || 24
    const slaThresholdMs = slaHours * 3600 * 1000
    const now = Date.now()

    const pendingWithdrawals = await db.withdrawal.findMany({ where: { status: 'PENDING' } })
    const staleWithdrawals = pendingWithdrawals.filter(w => {
      const ageMs = now - new Date(w.createdAt).getTime()
      return ageMs > slaThresholdMs
    })

    if (staleWithdrawals.length > 0) {
      staleWithdrawals.forEach(w => {
        const hoursPending = Math.round((now - new Date(w.createdAt).getTime()) / 3600000)
        report.anomalies.push(`Withdrawal #${w.id} (${w.amount} TND for user #${w.userId}) pending for ${hoursPending}h exceeding SLA threshold (${slaHours}h)`)
        logger.security('WITHDRAWAL_SLA_BREACH', `Pending withdrawal #${w.id} (${w.amount} TND) has breached the ${slaHours}h SLA threshold`, {
          withdrawalId: w.id,
          userId: w.userId,
          amount: w.amount,
          hoursPending,
        })
      })
    }

    if (!report.isBalanced || staleWithdrawals.length > 0) {
      // Trigger instant incident alert
      logger.security('CRITICAL_RECONCILIATION_ALERT', `Reconciliation audit flagged items! Balanced: ${report.isBalanced}, Stale Withdrawals: ${staleWithdrawals.length}`, {
        report,
        staleWithdrawalsCount: staleWithdrawals.length,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        status: report.isBalanced ? 'SLA_WARNING' : 'ALERT_MISMATCH',
        alertSent: true,
        report,
        staleWithdrawals,
      }, { status: report.isBalanced ? 200 : 500 })
    }

    // Ledger is healthy
    logger.audit('SCHEDULED_RECONCILIATION_SUCCESS', `Automated reconciliation audit passed. All ${report.activeOrdersCount} active orders verified with 0 SLA breaches.`, {
      totalEscrowLocked: report.totalEscrowLocked,
      currency: 'TND',
    })

    return NextResponse.json({
      status: 'HEALTHY',
      report,
      checkedAt: new Date().toISOString(),
    }, { status: 200 })
  } catch (err: any) {
    logger.error('CRON_RECONCILIATION_EXECUTION_ERROR', `Failed to execute scheduled reconciliation: ${err.message}`, { error: err })
    return NextResponse.json({ error: err.message || 'Reconciliation job failed' }, { status: 500 })
  }
}
