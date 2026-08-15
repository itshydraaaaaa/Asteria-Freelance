import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/authz'
import { getBalance } from '@/lib/ledger'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const authError = requireRole(session, 'FREELANCER')
    if (authError) return authError

    const userId = session!.user.id
    const body = await req.json()
    const { amount, method, accountDetails } = body

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount < 20) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is 20 TND' }, { status: 400 })
    }

    if (!method || !accountDetails) {
      return NextResponse.json({ error: 'Payout method and destination account details are required' }, { status: 400 })
    }

    // Check available balance
    let currentBalance = 0
    try {
      currentBalance = await getBalance(userId)
    } catch {
      const user = await db.user.findUnique({ where: { id: userId } })
      currentBalance = user?.walletBalance ?? 0
    }

    if (currentBalance < numericAmount) {
      return NextResponse.json(
        { error: `Insufficient available balance. You have ${currentBalance.toFixed(2)} TND, requested ${numericAmount.toFixed(2)} TND.` },
        { status: 400 }
      )
    }

    // Create withdrawal request in DB
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount: numericAmount,
        method,
        accountDetails,
        status: 'PENDING',
      },
    })

    // Log action in audit trail
    await db.auditLog.create({
      data: {
        adminId: 'system',
        adminName: 'Payout Gateway',
        action: 'WITHDRAWAL_REQUESTED',
        targetId: withdrawal.id,
        details: `Freelancer ${session!.user.name} requested withdrawal of ${numericAmount} TND via ${method} (${accountDetails})`,
      },
    })

    return NextResponse.json(
      {
        withdrawal,
        message: `Your withdrawal request of ${numericAmount.toFixed(2)} TND has been submitted to the Admin Finance Desk for processing.`,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('POST /api/wallet/withdraw error:', err)
    return NextResponse.json({ error: err.message || 'Failed to submit withdrawal request' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const withdrawals = await db.withdrawal.findMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ withdrawals })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load withdrawals' }, { status: 500 })
  }
}
