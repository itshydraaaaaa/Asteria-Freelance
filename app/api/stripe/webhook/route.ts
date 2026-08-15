import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const hasStripeConfig = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)

export async function POST(req: NextRequest) {
  if (!hasStripeConfig) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-03-25.dahlia' as any })
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch {
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const { db } = await import('@/lib/db')
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId
    if (orderId) {
      await db.order.update({ where: { id: orderId }, data: { status: 'ACTIVE' } })
    }
  }

  return NextResponse.json({ received: true })
}
