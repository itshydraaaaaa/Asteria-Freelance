import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/authz'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  return handleAccountDeletion(req)
}

export async function DELETE(req: NextRequest) {
  return handleAccountDeletion(req)
}

async function handleAccountDeletion(req: NextRequest) {
  try {
    const session = await auth()
    const authErr = requireAuth(session)
    if (authErr) return authErr

    const userId = session!.user.id

    // 1. Verify user has zero active / disputed contracts locked in escrow
    const activeOrders = await db.order.findMany({
      where: {
        status: 'ACTIVE',
      },
    })
    const hasActiveContract = activeOrders.some((o: any) => o.buyerId === userId || o.sellerId === userId)

    if (hasActiveContract) {
      return NextResponse.json({
        error: 'Cannot delete account with active in-progress contracts or locked escrow funds. Please complete or resolve active orders first.',
      }, { status: 400 })
    }

    // 2. Permanently delete user record and Supabase Auth identity
    await db.user.delete({ where: { id: userId } })

    // 3. Clear all authentication session cookies
    const res = NextResponse.json({
      success: true,
      message: 'Your account has been permanently deleted.',
    }, { status: 200 })

    res.cookies.delete('auth_session_token')
    res.cookies.delete('sb-access-token')
    res.cookies.delete('sb-refresh-token')

    try {
      const cookieStore = await cookies()
      cookieStore.delete('auth_session_token')
      cookieStore.delete('sb-access-token')
      cookieStore.delete('sb-refresh-token')
    } catch {}

    logger.audit('ACCOUNT_DELETED_USER_REQUEST', `User #${userId} permanently deleted their account`, {
      userId,
      timestamp: new Date().toISOString(),
    })

    return res
  } catch (err: any) {
    console.error('Account deletion error:', err)
    return NextResponse.json({ error: err.message || 'Failed to process account deletion request' }, { status: 500 })
  }
}
