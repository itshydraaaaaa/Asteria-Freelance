import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const reports = await db.report.findMany()
    return NextResponse.json({ reports })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { targetType, targetId, targetTitle, reason, description } = body

    if (!targetType || !targetId || !reason || !description) {
      return NextResponse.json({ error: 'Missing report details' }, { status: 400 })
    }

    const report = await db.report.create({
      data: {
        reporterId: session.user.id,
        reporterName: session.user.name || 'Anonymous User',
        targetType,
        targetId,
        targetTitle: targetTitle || 'Target Item',
        reason,
        description,
      }
    })

    return NextResponse.json({ report, message: 'Report submitted for admin review.' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/reports error:', err)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, status } = body

    if (!id || !['DISMISSED', 'RESOLVED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const updated = await db.report.update({
      where: { id },
      data: { status }
    })

    // Write to audit log
    await db.auditLog.create({
      data: {
        adminId: session?.user?.id ?? 'admin1',
        adminName: session?.user?.name || 'Admin',
        action: `REPORT_${status}`,
        details: `Report #${id} for ${updated?.targetType} (${updated?.targetTitle}) marked as ${status}`
      }
    })

    return NextResponse.json({ report: updated, message: `Report marked as ${status}` })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
}
