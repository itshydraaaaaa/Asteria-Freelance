import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/authz'
import { getBalance, debitWallet } from '@/lib/ledger'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

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

    // Check KYC status: only APPROVED accounts can withdraw funds
    const user = await db.user.findUnique({ where: { id: userId } })
    if (user && user.verifiedStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Identity verification (KYC) is required before initiating payouts and withdrawals. Please verify your profile in Dashboard > Verification.' },
        { status: 403 }
      )
    }

    // Check available balance
    let currentBalance = 0
    try {
      currentBalance = await getBalance(userId)
    } catch {
      const u = await db.user.findUnique({ where: { id: userId } })
      currentBalance = u?.walletBalance ?? 0
    }

    if (currentBalance < numericAmount) {
      return NextResponse.json(
        { error: `Insufficient available balance. You have ${currentBalance.toFixed(2)} TND, requested ${numericAmount.toFixed(2)} TND.` },
        { status: 400 }
      )
    }

    // 1. Immediately hold/debit the funds from user balance to prevent duplicate/overdraft exploit
    await debitWallet(userId, numericAmount, 'WITHDRAWAL', {
      note: `Payout request initiated via ${method} (${accountDetails})`,
      idempotencyKey: `with-req-${userId}-${Date.now()}`,
    })

    // 2. Create withdrawal request in DB
    const withdrawal = await db.withdrawal.create({
      data: {
        userId,
        amount: numericAmount,
        method,
        accountDetails,
        status: 'PENDING',
      },
    })

    // 3. Log action in audit trail
    logger.audit('WITHDRAWAL_REQUESTED', `Freelancer ${session!.user.name} requested withdrawal of ${numericAmount} TND via ${method}`, {
      userId,
      withdrawalId: withdrawal.id,
      amount: numericAmount,
      method,
    })

    return NextResponse.json(
      {
        withdrawal,
        message: `Your withdrawal request of ${numericAmount.toFixed(2)} TND has been submitted and funds held for transfer by the Admin Finance Desk.`,
      },
      { status: 201 }
    )
  } catch (err: any) {
    logger.error('WITHDRAWAL_REQUEST_ERROR', `Failed to submit withdrawal request: ${err.message}`, { error: err })
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
