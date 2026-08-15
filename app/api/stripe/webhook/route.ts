import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { creditWallet } from '@/lib/ledger'

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
    console.error('Stripe webhook verification error:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const { db } = await import('@/lib/db')
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    const userId = session.metadata?.userId
    const amount = parseFloat(session.metadata?.amount || '0')
    const paymentType = session.metadata?.paymentType || 'ORDER_PAYMENT'

    try {
      if (orderId) {
        // Activate order
        await db.order.update({ where: { id: orderId }, data: { status: 'ACTIVE' } })
        
        // Log in audit trail
        await db.auditLog.create({
          data: {
            adminId: 'system',
            adminName: 'Stripe Gateway',
            action: 'ESCROW_FUNDED_STRIPE',
            targetId: orderId,
            details: `Escrow funded via Stripe Checkout for Order #${orderId} (${amount} TND/USD)`,
          },
        })
      } else if (userId && amount > 0) {
        // Wallet deposit
        await creditWallet(userId, amount, 'DEPOSIT', {
          note: `Wallet Deposit via Stripe (Checkout Session ${session.id})`,
          idempotencyKey: `stripe-deposit-${session.id}`,
        })
      }
    } catch (err: any) {
      console.error('Error handling stripe checkout completed webhook:', err)
      return NextResponse.json({ error: 'Database update failed during webhook processing' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
