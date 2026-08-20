import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const adminErr = requireAdmin(session)
    if (adminErr) return adminErr

    const targetUser = await db.user.findUnique({ where: { id: params.id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { action, reason, newRole } = body

    if (action === 'BAN' || action === 'SUSPEND') {
      const updatedUser = await db.user.update({
        where: { id: params.id },
        data: {
          verifiedStatus: 'REJECTED',
          bio: `[ACCOUNT SUSPENDED BY ADMIN: ${reason || 'Terms violation'}] ${targetUser.bio || ''}`,
        } as any,
      })

      logger.audit('USER_SUSPENDED', `Admin #${session!.user.id} suspended user #${params.id}`, {
        adminId: session!.user.id,
        targetUserId: params.id,
        reason: reason || 'Violation of platform terms',
      })

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `User #${params.id} has been suspended.`,
      })
    }

    if (action === 'UNBAN' || action === 'ACTIVATE') {
      const updatedUser = await db.user.update({
        where: { id: params.id },
        data: {
          verifiedStatus: 'APPROVED',
        } as any,
      })

      logger.audit('USER_ACTIVATED', `Admin #${session!.user.id} reactivated user #${params.id}`, {
        adminId: session!.user.id,
        targetUserId: params.id,
      })

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `User #${params.id} has been reactivated.`,
      })
    }

    if (action === 'UPDATE_ROLE' && newRole) {
      const updatedUser = await db.user.update({
        where: { id: params.id },
        data: { role: newRole },
      })

      logger.audit('USER_ROLE_CHANGED', `Admin #${session!.user.id} changed role for user #${params.id} to ${newRole}`, {
        adminId: session!.user.id,
        targetUserId: params.id,
        newRole,
      })

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `User #${params.id} role changed to ${newRole}.`,
      })
    }

    return NextResponse.json({ error: 'Invalid admin action' }, { status: 400 })
  } catch (err: any) {
    console.error('POST /api/admin/users/[id] error:', err)
    return NextResponse.json({ error: err.message || 'Failed to execute user admin action' }, { status: 500 })
  }
}
