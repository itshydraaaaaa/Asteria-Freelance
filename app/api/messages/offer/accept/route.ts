import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { debitWallet, getBalance } from '@/lib/ledger'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyerId = session.user.id
    const body = await req.json()
    const { offerData, sellerId, messageId } = body

    if (!offerData || !sellerId) {
      return NextResponse.json({ error: 'Missing offer information' }, { status: 400 })
    }

    const offerAmount = parseFloat(offerData.price) || 0
    if (offerAmount <= 0) {
      return NextResponse.json({ error: 'Invalid offer price' }, { status: 400 })
    }

    // 1. Check buyer wallet balance
    let buyerBalance = 0
    try {
      buyerBalance = await getBalance(buyerId)
    } catch {
      const u = await db.user.findUnique({ where: { id: buyerId } })
      buyerBalance = u?.walletBalance ?? 0
    }

    if (buyerBalance < offerAmount) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. You have ${buyerBalance.toFixed(2)} TND, but offer total is ${offerAmount.toFixed(2)} TND. Please top up your wallet first.`,
          requiredAmount: offerAmount,
          currentBalance: buyerBalance,
        },
        { status: 402 }
      )
    }

    // 2. Create Order in database
    const order = await db.order.create({
      data: {
        gigId: 'custom',
        buyerId,
        sellerId,
        amount: offerAmount,
        status: 'ACTIVE',
      },
    })

    // 3. Debit buyer wallet into escrow
    try {
      await debitWallet(buyerId, offerAmount, 'FUND_ESCROW', {
        orderId: order.id,
        note: `Escrow funded for custom offer: ${offerData.title} (${offerAmount} TND)`,
        idempotencyKey: `custom-offer-${order.id}`,
      })
    } catch (err: any) {
      console.warn(`Debit fallback: ${err.message}`)
      const u = await db.user.findUnique({ where: { id: buyerId } })
      if (u) {
        await db.user.update({
          where: { id: buyerId },
          data: { walletBalance: Math.max(0, u.walletBalance - offerAmount) },
        })
      }
    }

    // 4. Create milestones
    if (Array.isArray(offerData.milestones) && offerData.milestones.length > 0) {
      await Promise.all(
        offerData.milestones.map((m: any, idx: number) =>
          db.milestone.create({
            data: {
              orderId: order.id,
              title: m.title || `Milestone ${idx + 1}`,
              amount: Number(m.amount) || Math.round(offerAmount / offerData.milestones.length),
              percentage: Math.round(((Number(m.amount) || 0) / offerAmount) * 100),
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
          title: `Custom Project: ${offerData.title}`,
          amount: offerAmount,
          percentage: 100,
          status: 'FUNDED',
          position: 1,
        },
      })
    }

    // 5. Send message in chat confirming acceptance
    await db.message.create({
      data: {
        senderId: buyerId,
        receiverId: sellerId,
        content: `🎉 Custom Offer Accepted! Order #${order.id.slice(0, 8)} (${offerAmount} TND) has been funded in escrow.`,
        msgType: 'TEXT',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      message: `Custom offer accepted! ${offerAmount} TND has been funded in escrow.`,
    })
  } catch (err: any) {
    console.error('POST /api/messages/offer/accept error:', err)
    return NextResponse.json({ error: err.message || 'Failed to accept custom offer' }, { status: 500 })
  }
}
