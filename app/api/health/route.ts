import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getReconciliationReport } from '@/lib/ledger'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  try {
    // 1. Verify DB query responsiveness
    const dbPingStart = Date.now()
    const usersCount = (await db.user.findMany()).length
    const dbLatencyMs = Date.now() - dbPingStart

    // 2. Verify Ledger integrity
    const reconciliation = await getReconciliationReport()

    const totalResponseTimeMs = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSecs: process.uptime ? Math.floor(process.uptime()) : 0,
      responseTimeMs: totalResponseTimeMs,
      checks: {
        database: {
          status: 'UP',
          latencyMs: dbLatencyMs,
          usersTracked: usersCount,
        },
        escrowLedger: {
          status: reconciliation.isBalanced ? 'UP' : 'ANOMALY_DETECTED',
          isBalanced: reconciliation.isBalanced,
          activeOrders: reconciliation.activeOrdersCount,
          totalEscrowLocked: reconciliation.totalEscrowLocked,
          currency: 'TND',
        },
        memory: {
          heapUsedMb: process.memoryUsage ? Math.round(process.memoryUsage().heapUsed / 1024 / 1024) : 0,
          heapTotalMb: process.memoryUsage ? Math.round(process.memoryUsage().heapTotal / 1024 / 1024) : 0,
        },
      },
    }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: err.message || 'Health check error',
    }, { status: 503 })
  }
}
