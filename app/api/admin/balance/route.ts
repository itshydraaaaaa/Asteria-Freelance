import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db }   from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, amount, type, reason } = body

    if (!userId || !amount || !['ADD', 'DEDUCT', 'SET'].includes(type)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let newBalance = user.walletBalance
    const val = parseFloat(amount)

    if (type === 'ADD') newBalance += val
    else if (type === 'DEDUCT') newBalance = Math.max(0, newBalance - val)
    else if (type === 'SET') newBalance = Math.max(0, val)

    const updated = await db.user.update({
      where: { id: userId },
      data: { walletBalance: newBalance }
    })

    // Write to audit log
    await db.auditLog.create({
      data: {
        adminId: session?.user?.id ?? 'admin1',
        adminName: session?.user?.name || 'Admin',
        action: 'BALANCE_ADJUSTED',
        details: `Adjusted balance for user ${user.name} (${user.email}). Type: ${type}, Value: $${val}, New Balance: $${newBalance}. Reason: ${reason || 'Admin modification'}`
      }
    })

    return NextResponse.json({ user: updated, message: `Balance updated to $${newBalance}` })
  } catch (err) {
    console.error('Admin balance update error:', err)
    return NextResponse.json({ error: 'Failed to adjust balance' }, { status: 500 })
  }
}
