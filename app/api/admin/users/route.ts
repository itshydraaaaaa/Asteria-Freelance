import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const adminErr = requireAdmin(session)
    if (adminErr) return adminErr

    const rawUsers = await db.user.findMany()
    const users = (rawUsers || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      walletBalance: u.walletBalance,
      verifiedStatus: u.verifiedStatus,
      rating: u.rating,
      reviewCount: u.reviewCount,
      createdAt: u.createdAt,
      image: u.image,
      bio: u.bio,
      skills: u.skills,
    }))
    return NextResponse.json({ users }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 })
  }
}
