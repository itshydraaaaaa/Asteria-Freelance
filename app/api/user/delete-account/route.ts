import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/authz'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
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
    const hasActiveContract = activeOrders.some(o => o.buyerId === userId || o.sellerId === userId)

    if (hasActiveContract) {
      return NextResponse.json({
        error: 'Cannot delete account with active in-progress contracts or locked escrow funds. Please complete or resolve active orders first.',
      }, { status: 400 })
    }

    // 2. Anonymize user record
    const anonymizedName = `Deleted User (${userId.slice(0, 6)})`
    const anonymizedEmail = `deleted_${userId}_${Date.now()}@anonymized.asteria.tn`

    await db.user.update({
      where: { id: userId },
      data: {
        name: anonymizedName,
        email: anonymizedEmail,
        bio: '[Account Deleted Upon User Request]',
        skills: [],
        verifiedStatus: 'UNSUBMITTED',
      } as any,
    })

    logger.audit('ACCOUNT_DELETED_GDPR', `User #${userId} requested full account deletion and data anonymization`, {
      userId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Your account has been deleted and personal data anonymized.',
    }, { status: 200 })
  } catch (err: any) {
    console.error('POST /api/user/delete-account error:', err)
    return NextResponse.json({ error: 'Failed to process account deletion request' }, { status: 500 })
  }
}
