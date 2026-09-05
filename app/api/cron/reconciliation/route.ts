import { NextRequest, NextResponse } from 'next/server'
import { getReconciliationReport, getLedgerHistory, processEscrowRelease } from '@/lib/ledger'
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
 * 3. Stripe external balance transactions mismatch against internal ledger (Task 2.3).
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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

    // 2. Stripe External Ledger Reconciliation (Task 2.3)
    let stripeReconciliation = { checked: false, stripeGrossUsd: 0, internalGrossUsd: 0, discrepancyUsd: 0 }
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-03-25.dahlia' as any })
        const balanceTxs = await stripe.balanceTransactions.list({ limit: 100 })

        const stripeGrossUsd = balanceTxs.data
          .filter(t => t.type === 'charge' && t.status === 'available')
          .reduce((sum, t) => sum + (t.amount / 100), 0)

        const txs = await getLedgerHistory('all', 500)
        const stripeDeposits = txs.filter(t => t.type === 'DEPOSIT' && t.idempotencyKey && t.idempotencyKey.startsWith('stripe-'))

        const internalGrossUsd = stripeDeposits.reduce((sum, t) => {
          const appliedRate = t.exchangeRateApplied || 0.32
          return sum + (t.amount * appliedRate)
        }, 0)

        const discrepancyUsd = Math.round(Math.abs(stripeGrossUsd - internalGrossUsd) * 100) / 100

        stripeReconciliation = {
          checked: true,
          stripeGrossUsd: Math.round(stripeGrossUsd * 100) / 100,
          internalGrossUsd: Math.round(internalGrossUsd * 100) / 100,
          discrepancyUsd,
        }

        if (discrepancyUsd > 10.0) {
          report.anomalies.push(`Stripe external balance mismatch! Stripe Gross: $${stripeReconciliation.stripeGrossUsd} USD, Internal Ledger Expected: $${stripeReconciliation.internalGrossUsd} USD (Diff: $${discrepancyUsd})`)
          logger.security('STRIPE_RECONCILIATION_MISMATCH', `Stripe external ledger drift of $${discrepancyUsd} USD detected`, {
            stripeReconciliation,
          })
        }
      } catch (err: any) {
        logger.warn('STRIPE_RECONCILIATION_FETCH_ERROR', `Could not fetch Stripe balance transactions: ${err.message}`)
      }
    }

    // 3. 7-Day Escrow Auto-Release for Delivered Orders
    const sevenDaysAgoMs = now - (7 * 24 * 3600 * 1000)
    const activeOrders = await db.order.findMany({ where: { status: 'DELIVERED' } })
    const autoReleaseEligible = activeOrders.filter(o => {
      const deliveredTime = new Date((o as any).deliveredAt || o.createdAt).getTime()
      return deliveredTime < sevenDaysAgoMs
    })

    const autoReleasedOrders: string[] = []
    for (const order of autoReleaseEligible) {
      try {
        await db.order.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' },
        })
        const { sellerPayout, platformFee } = await processEscrowRelease(order.id, order.sellerId, order.amount)
        autoReleasedOrders.push(order.id)
        logger.audit('ESCROW_7_DAY_AUTO_RELEASE', `Order #${order.id} automatically released after 7 days in DELIVERED state`, {
          orderId: order.id,
          sellerId: order.sellerId,
          amount: order.amount,
          sellerPayout,
          platformFee,
        })
      } catch (err: any) {
        logger.error('AUTO_RELEASE_ORDER_ERROR', `Failed to auto-release order #${order.id}: ${err.message}`, { orderId: order.id, error: err })
      }
    }

    const hasAnomalies = !report.isBalanced || staleWithdrawals.length > 0 || stripeReconciliation.discrepancyUsd > 10.0

    if (hasAnomalies) {
      // Trigger instant incident alert
      logger.security('CRITICAL_RECONCILIATION_ALERT', `Reconciliation audit flagged items! Balanced: ${report.isBalanced}, Stale Withdrawals: ${staleWithdrawals.length}`, {
        report,
        staleWithdrawalsCount: staleWithdrawals.length,
        stripeReconciliation,
        autoReleasedCount: autoReleasedOrders.length,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        status: report.isBalanced ? 'SLA_OR_STRIPE_WARNING' : 'ALERT_MISMATCH',
        alertSent: true,
        report,
        staleWithdrawals,
        stripeReconciliation,
        autoReleasedOrders,
      }, { status: report.isBalanced ? 200 : 500 })
    }

    // Ledger is healthy
    logger.audit('SCHEDULED_RECONCILIATION_SUCCESS', `Automated reconciliation audit passed. All ${report.activeOrdersCount} active orders verified with 0 SLA breaches. Auto-released: ${autoReleasedOrders.length}.`, {
      totalEscrowLocked: report.totalEscrowLocked,
      currency: 'TND',
      stripeReconciliation,
      autoReleasedCount: autoReleasedOrders.length,
    })

    return NextResponse.json({
      status: 'HEALTHY',
      report,
      stripeReconciliation,
      autoReleasedOrders,
      checkedAt: new Date().toISOString(),
    }, { status: 200 })
  } catch (err: any) {
    logger.error('CRON_RECONCILIATION_EXECUTION_ERROR', `Failed to execute scheduled reconciliation: ${err.message}`, { error: err })
    return NextResponse.json({ error: err.message || 'Reconciliation job failed' }, { status: 500 })
  }
}
