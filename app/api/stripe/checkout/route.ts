import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/authz'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const authError = requireAuth(session)
    if (authError) return authError

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      return NextResponse.json(
        { error: 'Stripe payments are not configured in environment (STRIPE_SECRET_KEY missing).' },
        { status: 503 }
      )
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2026-03-25.dahlia' as any })
    const body = await req.json()
    const { orderId, amount, type = 'ORDER_PAYMENT', title = 'Asteria Escrow Payment' } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    const currency = (process.env.CURRENCY || 'tnd').toLowerCase()
    const numericAmount = Math.round(Number(amount) * 100) // in cents/sub-units

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency === 'tnd' ? 'usd' : currency, // Note: Stripe supports USD/EUR for MENA cards if TND direct charge is restricted
            product_data: {
              name: title,
              description: `Asteria Freelance Escrow Protection — Safe payment for order #${orderId || 'Direct'}`,
            },
            unit_amount: numericAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: orderId
        ? `${origin}/dashboard/orders/${orderId}?payment=success`
        : `${origin}/dashboard/wallet?deposit=success`,
      cancel_url: orderId
        ? `${origin}/dashboard/orders/${orderId}?payment=cancelled`
        : `${origin}/dashboard/wallet?deposit=cancelled`,
      metadata: {
        userId: session!.user.id,
        orderId: orderId || '',
        paymentType: type,
        amount: String(amount),
      },
    })

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id })
  } catch (err: any) {
    console.error('POST /api/stripe/checkout error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to create checkout session' }, { status: 500 })
  }
}
