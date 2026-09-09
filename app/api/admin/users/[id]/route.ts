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

    const body = await req.json()
    const { action, reason, newRole } = body

    // Protect platform reserve treasury and admin self from destructive actions
    if (params.id === session!.user.id && (action === 'BAN' || action === 'SUSPEND' || action === 'DELETE')) {
      return NextResponse.json({ error: 'You cannot ban your own administrative account.' }, { status: 400 })
    }
    if (params.id === '00000000-0000-4000-8000-000000000000' || params.id === '00000000-0000-0000-0000-000000000000') {
      return NextResponse.json({ error: 'Cannot ban platform reserve treasury account.' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id: params.id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'BAN' || action === 'SUSPEND') {

      const cleanBio = (targetUser.bio || '').replace(/^\[ACCOUNT SUSPENDED BY ADMIN:.*?\]\s*/, '')
      const updatedUser = await db.user.update({
        where: { id: params.id },
        data: {
          verifiedStatus: 'BANNED',
          bio: `[ACCOUNT SUSPENDED BY ADMIN: ${reason || 'Terms violation'}] ${cleanBio}`.trim(),
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
        message: `User #${params.id} (${targetUser.name}) has been suspended.`,
      })
    }

    if (action === 'UNBAN' || action === 'ACTIVATE') {
      const cleanBio = (targetUser.bio || '').replace(/^\[ACCOUNT SUSPENDED BY ADMIN:.*?\]\s*/, '')
      const updatedUser = await db.user.update({
        where: { id: params.id },
        data: {
          verifiedStatus: 'APPROVED',
          bio: cleanBio,
        } as any,
      })

      logger.audit('USER_ACTIVATED', `Admin #${session!.user.id} reactivated user #${params.id}`, {
        adminId: session!.user.id,
        targetUserId: params.id,
      })

      return NextResponse.json({
        success: true,
        user: updatedUser,
        message: `User #${params.id} (${targetUser.name}) has been reactivated.`,
      })
    }

    if (action === 'DELETE') {
      return executeUserDeletion(params.id, session!.user.id, targetUser)
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    const adminErr = requireAdmin(session)
    if (adminErr) return adminErr

    if (params.id === session!.user.id) {
      return NextResponse.json({ error: 'Administrators cannot delete their own administrative account.' }, { status: 400 })
    }
    if (params.id === '00000000-0000-4000-8000-000000000000' || params.id === '00000000-0000-0000-0000-000000000000') {
      return NextResponse.json({ error: 'Cannot delete the platform reserve treasury account.' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id: params.id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return executeUserDeletion(params.id, session!.user.id, targetUser)
  } catch (err: any) {
    console.error('DELETE /api/admin/users/[id] error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete user account' }, { status: 500 })
  }
}

async function executeUserDeletion(targetUserId: string, adminId: string, targetUser: any) {
  // 1. Prevent admin self-deletion
  if (targetUserId === adminId) {
    return NextResponse.json({ error: 'Administrators cannot delete their own administrative account.' }, { status: 400 })
  }

  // 2. Prevent deletion of treasury account
  if (targetUserId === '00000000-0000-4000-8000-000000000000' || targetUserId === '00000000-0000-0000-0000-000000000000') {
    return NextResponse.json({ error: 'Cannot delete the platform reserve treasury account.' }, { status: 400 })
  }

  // 3. Prevent deletion if user has active in-progress orders or locked escrow
  const activeOrders = await db.order.findMany({ where: { status: 'ACTIVE' } })
  const hasActiveOrders = activeOrders.some((o: any) => o.buyerId === targetUserId || o.sellerId === targetUserId)
  if (hasActiveOrders) {
    return NextResponse.json({
      error: 'Cannot delete account with active in-progress contracts or locked escrow funds. Please complete or cancel orders first.',
    }, { status: 400 })
  }

  // 4. Delete user permanently from database and Supabase auth
  await db.user.delete({ where: { id: targetUserId } })

  logger.audit('USER_DELETED_BY_ADMIN', `Admin #${adminId} permanently deleted user #${targetUserId} (${targetUser.email})`, {
    adminId,
    targetUserId,
    userEmail: targetUser.email,
  })

  return NextResponse.json({
    success: true,
    message: `User #${targetUserId} (${targetUser.name}) has been permanently deleted.`,
  })
}
