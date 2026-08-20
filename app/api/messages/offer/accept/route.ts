import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { debitWallet, getBalance } from '@/lib/ledger'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyerId = session.user.id
    const body = await req.json()
    const { messageId, sellerId } = body

    if (!messageId || !sellerId) {
      return NextResponse.json({ error: 'Message ID and seller ID are required' }, { status: 400 })
    }

    // 1. Fetch the authentic message from database to re-verify server-side state
    const allMessages = await db.message.findMany({
      where: { userId: buyerId },
    })
    const foundMsg = allMessages.find(m => m.id === messageId || (m.offerData && m.offerData.id === messageId))

    if (!foundMsg || foundMsg.msgType !== 'CUSTOM_OFFER' || !foundMsg.offerData) {
      return NextResponse.json({ error: 'Authentic custom offer not found in conversation records' }, { status: 404 })
    }

    // Security checks: Only intended recipient can accept; offer must be from the seller
    if (foundMsg.receiverId !== buyerId || foundMsg.senderId !== sellerId) {
      logger.security('UNAUTHORIZED_OFFER_ACCEPTANCE', `User #${buyerId} attempted to accept offer belonging to sender #${foundMsg.senderId}`, {
        buyerId,
        messageId,
      })
      return NextResponse.json({ error: 'Unauthorized to accept this offer' }, { status: 403 })
    }

    if (foundMsg.offerData.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'This custom offer has already been accepted and funded' }, { status: 409 })
    }

    // 2. Extract verified server-side offer data (NEVER trust client body amounts)
    const verifiedOffer = foundMsg.offerData
    const verifiedAmount = parseFloat(verifiedOffer.price) || 0

    if (verifiedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid offer pricing' }, { status: 400 })
    }

    // 3. Check buyer wallet balance
    let buyerBalance = 0
    try {
      buyerBalance = await getBalance(buyerId)
    } catch {
      const u = await db.user.findUnique({ where: { id: buyerId } })
      buyerBalance = u?.walletBalance ?? 0
    }

    if (buyerBalance < verifiedAmount) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. You have ${buyerBalance.toFixed(2)} TND, but offer total is ${verifiedAmount.toFixed(2)} TND. Please top up your wallet first.`,
          requiredAmount: verifiedAmount,
          currentBalance: buyerBalance,
        },
        { status: 402 }
      )
    }

    // 4. Create Order in database
    const order = await db.order.create({
      data: {
        gigId: 'custom',
        buyerId,
        sellerId,
        amount: verifiedAmount,
        status: 'ACTIVE',
      },
    })

    // 5. Debit buyer wallet into escrow atomically
    await debitWallet(buyerId, verifiedAmount, 'FUND_ESCROW', {
      orderId: order.id,
      note: `Escrow funded for custom offer: ${verifiedOffer.title} (${verifiedAmount} TND)`,
      idempotencyKey: `custom-offer-${order.id}`,
    })

    // 6. Create milestones from verified offer structure
    if (Array.isArray(verifiedOffer.milestones) && verifiedOffer.milestones.length > 0) {
      await Promise.all(
        verifiedOffer.milestones.map((m: any, idx: number) =>
          db.milestone.create({
            data: {
              orderId: order.id,
              title: m.title || `Milestone ${idx + 1}`,
              amount: Number(m.amount) || Math.round(verifiedAmount / verifiedOffer.milestones.length),
              percentage: Math.round(((Number(m.amount) || 0) / verifiedAmount) * 100),
              status: idx === 0 ? 'FUNDED' : 'PENDING',
              position: idx + 1,
            },
          })
        )
      )
    } else {
      await db.milestone.create({
        data: {
          orderId: order.id,
          title: `Custom Project: ${verifiedOffer.title}`,
          amount: verifiedAmount,
          percentage: 100,
          status: 'FUNDED',
          position: 1,
        },
      })
    }

    // 7. Mark original offer message as ACCEPTED to prevent reuse
    verifiedOffer.status = 'ACCEPTED'
    await db.message.create({
      data: {
        senderId: buyerId,
        receiverId: sellerId,
        content: `🎉 Custom Offer Accepted! Order #${order.id.slice(0, 8)} (${verifiedAmount} TND) has been funded in escrow.`,
        msgType: 'TEXT',
      },
    })

    logger.audit('CUSTOM_OFFER_ACCEPTED', `Buyer #${buyerId} accepted and funded custom offer #${verifiedOffer.id} (${verifiedAmount} TND)`, {
      orderId: order.id,
      buyerId,
      sellerId,
      amount: verifiedAmount,
    })

    return NextResponse.json({
      orderId: order.id,
      message: `Custom offer accepted! ${verifiedAmount} TND has been funded in escrow.`,
    })
  } catch (err: any) {
    logger.error('OFFER_ACCEPTANCE_FAILED', `Failed to accept custom offer: ${err.message}`, { error: err })
    return NextResponse.json({ error: err.message || 'Failed to accept custom offer' }, { status: 500 })
  }
}
