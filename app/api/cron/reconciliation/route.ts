import { NextRequest, NextResponse } from 'next/server'
import { getReconciliationReport } from '@/lib/ledger'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/reconciliation — Automated Scheduled Ledger Reconciliation
 *
 * Runs automatically via Vercel Cron or scheduled HTTP job.
 * Enforces CRON_SECRET authorization header in production.
 * Automatically dispatches high-priority paging alerts if balance anomaly is detected.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 })
    }

    const report = await getReconciliationReport()

    if (!report.isBalanced) {
      // Trigger instant incident alert
      logger.security('CRITICAL_RECONCILIATION_MISMATCH', `Financial ledger balance mismatch detected! Active Escrow: ${report.totalEscrowLocked} TND, User Balances: ${report.totalUserBalances} TND`, {
        report,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        status: 'ALERT_MISMATCH',
        alertSent: true,
        report,
      }, { status: 500 })
    }

    // Ledger is healthy
    logger.audit('SCHEDULED_RECONCILIATION_SUCCESS', `Automated reconciliation audit passed. All ${report.activeOrdersCount} active orders verified.`, {
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
