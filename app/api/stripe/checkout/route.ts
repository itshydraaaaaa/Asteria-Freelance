import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/authz'
import { getTndToUsdRate } from '@/lib/fx'

export const dynamic = 'force-dynamic'

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

    let verifiedTndAmount: number
    if (orderId) {
      const order = await db.order.findUnique({ where: { id: orderId } })
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      verifiedTndAmount = Number(order.amount)
      if (isNaN(verifiedTndAmount) || verifiedTndAmount <= 0) {
        return NextResponse.json({ error: 'Order has invalid amount' }, { status: 400 })
      }
    } else {
      // Wallet deposit flow where orderId is not applicable
      const numericTndAmount = parseFloat(amount)
      if (isNaN(numericTndAmount) || numericTndAmount <= 0) {
        return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
      }
      verifiedTndAmount = numericTndAmount
    }

    const currencyConfig = (process.env.CURRENCY || 'tnd').toLowerCase()
    const chargeCurrency = currencyConfig === 'tnd' ? 'usd' : currencyConfig

    // Fetch Live FX rate (Task 2.1)
    const { rate: currentFxRate, source: fxSource } = await getTndToUsdRate()

    // Calculate charge amount in cents, accounting for live FX rate if converting TND -> USD
    const chargeAmountUsd = currencyConfig === 'tnd' ? (verifiedTndAmount * currentFxRate) : verifiedTndAmount
    const unitAmountCents = Math.max(50, Math.round(chargeAmountUsd * 100)) // Stripe minimum 50 cents

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: chargeCurrency,
            product_data: {
              name: title,
              description: currencyConfig === 'tnd'
                ? `Asteria Escrow: ${verifiedTndAmount.toFixed(2)} TND (~$${chargeAmountUsd.toFixed(2)} USD at ${fxSource} rate ${currentFxRate}) for Order #${orderId || 'Direct'}`
                : `Asteria Freelance Escrow Protection — Safe payment for order #${orderId || 'Direct'}`,
            },
            unit_amount: unitAmountCents,
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
        tndAmount: String(verifiedTndAmount),
        usdAmount: String(chargeAmountUsd.toFixed(2)),
        exchangeRateApplied: String(currentFxRate),
        fxSource,
      },
    })

    return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id })
  } catch (err: any) {
    console.error('POST /api/stripe/checkout error:', err)
    return NextResponse.json({ error: err?.message || 'Failed to create checkout session' }, { status: 500 })
  }
}
