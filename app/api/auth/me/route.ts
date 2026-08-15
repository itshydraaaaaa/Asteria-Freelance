import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  let walletBalance = 0
  let verifiedStatus = 'UNSUBMITTED'

  try {
    const userDoc = await db.user.findUnique({ where: { id: session.user.id } })
    if (userDoc) {
      walletBalance = userDoc.walletBalance ?? 0
      verifiedStatus = userDoc.verifiedStatus ?? 'UNSUBMITTED'
    }
  } catch {}

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      image: session.user.image,
      walletBalance,
      verifiedStatus,
    },
  })
}
