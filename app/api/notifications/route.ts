import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/authz'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const authErr = requireAuth(session)
    if (authErr) return authErr

    const userId = session!.user.id

    const allNotifs = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const unreadCount = allNotifs.filter(n => !n.isRead).length

    return NextResponse.json({
      notifications: allNotifs,
      unreadCount,
    })
  } catch (err: any) {
    console.error('GET /api/notifications error:', err)
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const authErr = requireAuth(session)
    if (authErr) return authErr

    const userId = session!.user.id
    const body = await req.json()
    const { action, id } = body

    if (action === 'MARK_ALL_READ') {
      const count = await db.notification.markAllAsRead(userId)
      return NextResponse.json({ success: true, count, message: 'All notifications marked as read' })
    }

    if (id) {
      const updated = await db.notification.update({
        where: { id },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, notification: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('POST /api/notifications error:', err)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
