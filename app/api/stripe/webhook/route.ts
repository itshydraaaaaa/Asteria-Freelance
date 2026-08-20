import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { creditWallet, debitWallet } from '@/lib/ledger'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const hasStripeConfig = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)

export async function POST(req: NextRequest) {
  if (!hasStripeConfig) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-03-25.dahlia' as any })
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (err: any) {
    logger.error('STRIPE_WEBHOOK_SIGNATURE_FAILED', `Signature verification error: ${err.message}`)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const { db } = await import('@/lib/db')
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    const userId = session.metadata?.userId
    const tndAmount = parseFloat(session.metadata?.tndAmount || session.metadata?.amount || '0')
    const paymentType = session.metadata?.paymentType || 'ORDER_PAYMENT'
    const exchangeRateApplied = session.metadata?.exchangeRateApplied ? parseFloat(session.metadata.exchangeRateApplied) : undefined

    try {
      if (orderId && tndAmount > 0) {
        // 1. Activate order
        const updatedOrder = await db.order.update({
          where: { id: orderId },
          data: { status: 'ACTIVE' },
        })

        // 2. Record atomic deposit and escrow lock in the financial ledger with applied rate
        const buyerId = userId || updatedOrder?.buyerId || 'system'
        await creditWallet(buyerId, tndAmount, 'DEPOSIT', {
          note: `Deposit via Stripe Checkout for Order #${orderId}`,
          orderId,
          idempotencyKey: `stripe-dep-order-${session.id}`,
          exchangeRateApplied,
        })

        await debitWallet(buyerId, tndAmount, 'FUND_ESCROW', {
          note: `Escrow funded via Stripe Checkout for Order #${orderId}`,
          orderId,
          idempotencyKey: `stripe-fund-order-${session.id}`,
          exchangeRateApplied,
        })

        // 3. Log audit event
        logger.audit('STRIPE_ORDER_ESCROW_FUNDED', `Order #${orderId} funded via Stripe (${tndAmount} TND at rate ${exchangeRateApplied ?? 'N/A'})`, {
          orderId,
          userId: buyerId,
          amount: tndAmount,
          exchangeRateApplied,
          sessionId: session.id,
        })
      } else if (userId && tndAmount > 0) {
        // Wallet deposit
        await creditWallet(userId, tndAmount, 'DEPOSIT', {
          note: `Wallet Deposit via Stripe (Checkout Session ${session.id})`,
          idempotencyKey: `stripe-deposit-${session.id}`,
          exchangeRateApplied,
        })

        logger.audit('STRIPE_WALLET_DEPOSIT', `User #${userId} deposited ${tndAmount} TND via Stripe (Rate: ${exchangeRateApplied ?? 'N/A'})`, {
          userId,
          amount: tndAmount,
          exchangeRateApplied,
          sessionId: session.id,
        })
      }
    } catch (err: any) {
      logger.error('STRIPE_WEBHOOK_PROCESSING_FAILED', `Error processing checkout session: ${err.message}`, {
        sessionId: session.id,
        orderId,
        userId,
        error: err,
      })
      return NextResponse.json({ error: 'Database update failed during webhook processing' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
