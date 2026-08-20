import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/authz'
import { getReconciliationReport } from '@/lib/ledger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const adminErr = requireAdmin(session)
    if (adminErr) return adminErr

    const report = await getReconciliationReport()

    return NextResponse.json(report, { status: 200 })
  } catch (err: any) {
    console.error('GET /api/admin/reconciliation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate reconciliation report' }, { status: 500 })
  }
}
