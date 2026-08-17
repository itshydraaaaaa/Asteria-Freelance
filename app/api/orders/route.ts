import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { debitWallet, getBalance } from '@/lib/ledger'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/orders — Place a new Escrow Order for a Gig
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to place an order' }, { status: 401 })
    }

    const buyerId = session.user.id
    const body = await req.json()
    const {
      gigId,
      packageLabel = 'Standard',
      amount,
      paymentMode = 'FULL_JOB',
      milestones,
      notes,
    } = body

    if (!gigId) {
      return NextResponse.json({ error: 'Gig ID is required' }, { status: 400 })
    }

    const gig = await db.gig.findUnique({ where: { id: gigId } })
    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    const sellerId = gig.freelancerId
    if (buyerId === sellerId) {
      return NextResponse.json({ error: 'You cannot order your own gig' }, { status: 400 })
    }

    const orderAmount = parseFloat(amount) || gig.price
    if (orderAmount <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 })
    }

    // 1. Check buyer wallet balance
    let buyerBalance = 0
    try {
      buyerBalance = await getBalance(buyerId)
    } catch {
      const u = await db.user.findUnique({ where: { id: buyerId } })
      buyerBalance = u?.walletBalance ?? 0
    }

    if (buyerBalance < orderAmount) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. You have ${buyerBalance.toFixed(2)} TND, but order total is ${orderAmount.toFixed(2)} TND. Please top up your wallet first.`,
          requiredAmount: orderAmount,
          currentBalance: buyerBalance,
        },
        { status: 402 }
      )
    }

    // 2. Create the Order in database
    const order = await db.order.create({
      data: {
        gigId,
        buyerId,
        sellerId,
        amount: orderAmount,
        status: 'ACTIVE',
      },
    })

    // 3. Debit buyer wallet into escrow
    try {
      await debitWallet(buyerId, orderAmount, 'FUND_ESCROW', {
        orderId: order.id,
        note: `Escrow funded for order #${order.id.slice(0, 8)} (${gig.title} - ${packageLabel})`,
        idempotencyKey: `order-fund-${order.id}`,
      })
    } catch (err: any) {
      console.warn(`Debit wallet fallback: ${err.message}`)
      const u = await db.user.findUnique({ where: { id: buyerId } })
      if (u) {
        await db.user.update({
          where: { id: buyerId },
          data: { walletBalance: Math.max(0, u.walletBalance - orderAmount) },
        })
      }
    }

    // 4. Create milestones if milestone payment mode was chosen
    if (paymentMode === 'MILESTONE' && Array.isArray(milestones) && milestones.length > 0) {
      await Promise.all(
        milestones.map((m: any, idx: number) =>
          db.milestone.create({
            data: {
              orderId: order.id,
              title: m.title || `Milestone ${idx + 1}`,
              amount: Number(m.amount) || Math.round(orderAmount / milestones.length),
              percentage: Math.round(((Number(m.amount) || 0) / orderAmount) * 100),
              status: idx === 0 ? 'FUNDED' : 'PENDING',
              position: idx + 1,
            },
          })
        )
      )
    } else {
      // Default single milestone representing full project
      await db.milestone.create({
        data: {
          orderId: order.id,
          title: `Full Project: ${gig.title}`,
          amount: orderAmount,
          percentage: 100,
          status: 'FUNDED',
          position: 1,
        },
      })
    }

    // 5. Send notifications
    const seller = await db.user.findUnique({ where: { id: sellerId } })
    if (seller?.email) {
      await sendEmail({
        to: seller.email,
        event: 'ORDER_PLACED',
        data: {
          gigTitle: gig.title,
          amount: orderAmount,
          buyerName: session.user.name ?? 'Client',
          orderId: order.id,
        },
      }).catch(() => {})
    }

    // 6. Log in Audit trail
    await db.auditLog.create({
      data: {
        adminId: session.user.id,
        adminName: session.user.name || 'Client',
        action: 'ORDER_CREATED_ESCROW_FUNDED',
        targetId: order.id,
        details: `Client ${session.user.name} created order for "${gig.title}" (${orderAmount} TND) with ${paymentMode} payment.`,
      },
    })

    return NextResponse.json({
      order,
      orderId: order.id,
      message: `Order #${order.id.slice(0, 8)} created! ${orderAmount} TND has been securely funded in escrow.`,
    }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/orders error:', err)
    return NextResponse.json({ error: err.message || 'Failed to place order' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const orders = await db.order.findMany({
      where: {
        buyerId: userId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch orders' }, { status: 500 })
  }
}
