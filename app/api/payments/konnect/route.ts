import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { creditWallet } from '@/lib/ledger'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Konnect Sandbox Payment Gateway Handler
 * Supports generating payment sessions and verifying webhook notifications with constant-time HMAC & timestamp anti-replay.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, amount, orderId, userId, paymentRef, signature, timestamp } = body

    if (action === 'INITIATE_PAYMENT') {
      const session = await auth()
      const effectiveUserId = session?.user?.id || userId
      if (!effectiveUserId || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Valid user ID and positive amount required' }, { status: 400 })
      }

      const ref = `konnect_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const payUrl = `https://sandbox.gateway.konnect.network/pay/${ref}`

      return NextResponse.json({
        success: true,
        paymentRef: ref,
        payUrl,
        amount: Number(amount),
        currency: 'TND',
        gateway: 'KONNECT_SANDBOX',
      }, { status: 200 })
    }

    if (action === 'WEBHOOK') {
      // 1. Anti-Replay Timestamp Validation (Task 2.4)
      const now = Date.now()
      const reqTimestamp = Number(timestamp)

      if (!timestamp || isNaN(reqTimestamp) || Math.abs(now - reqTimestamp) > WEBHOOK_TOLERANCE_MS) {
        return NextResponse.json(
          { error: 'Webhook timestamp expired or out of tolerance window (replay attack prevention).' },
          { status: 400 }
        )
      }

      // 2. Constant-Time HMAC Signature Verification (Task 2.4)
      const secret = process.env.KONNECT_WEBHOOK_KEY
      if (!secret) {
        console.error('CRITICAL: KONNECT_WEBHOOK_KEY is missing from environment')
        return NextResponse.json({ error: 'Webhook service misconfigured' }, { status: 500 })
      }
      const payloadString = `${paymentRef}:${amount}:${orderId || ''}:${userId || ''}:${timestamp}`
      const expectedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex')

      if (!signature || typeof signature !== 'string') {
        return NextResponse.json({ error: 'Missing Konnect webhook signature' }, { status: 401 })
      }

      const sigBuf = Buffer.from(signature, 'hex')
      const expBuf = Buffer.from(expectedSignature, 'hex')

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return NextResponse.json({ error: 'Invalid Konnect webhook signature' }, { status: 401 })
      }

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { status: 'ACTIVE' },
        })

        await db.auditLog.create({
          data: {
            adminId: 'system',
            adminName: 'Konnect Gateway',
            action: 'ESCROW_FUNDED_KONNECT',
            targetId: orderId,
            details: `Order #${orderId} escrow successfully funded via Konnect (${amount} TND)`,
          },
        })
      } else if (userId && amount > 0) {
        await creditWallet(userId, Number(amount), 'DEPOSIT', {
          note: `Konnect Sandbox Wallet Deposit (Ref: ${paymentRef})`,
          idempotencyKey: `konnect-deposit-${paymentRef}`,
        })
      }

      return NextResponse.json({ verified: true, paymentRef, status: 'SUCCESS' }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid action. Supported: INITIATE_PAYMENT, WEBHOOK' }, { status: 400 })
  } catch (err: any) {
    console.error('POST /api/payments/konnect error:', err)
    return NextResponse.json({ error: err.message || 'Konnect gateway error' }, { status: 500 })
  }
}
